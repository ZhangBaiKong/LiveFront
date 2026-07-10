/* LiveFront Preview Manager */
window.LiveFront = window.LiveFront || {};

class PreviewManager {
  constructor() {
    this._container = null
    this._webview = null
    this._toolbarEl = null
    this._webviewArea = null
    this._wrapperEl = null
    this._loadingEl = null
    this._emptyEl = null
    this._port = 0
    this._projectPath = null
    this._entryFile = '/index.html'
    this._device = 'desktop'
    this._deviceWidths = { desktop: '100%', tablet: '768px', mobile: '375px' }
    this._ready = false
    this._pollTimer = null
    this._framework = 'html'
    this._frameworkInfo = null
    this._badgeEl = null
    this._reactMode = false
    this._vueMode = false
    this._compiledCache = new Map()
    this._vueRuntimeCache = null
  }

  init(containerEl) {
    this._container = containerEl
    this._container.innerHTML = ''
    this._container.className = 'preview-container'

    this._toolbarEl = document.createElement('div')
    this._toolbarEl.className = 'preview-toolbar'
    this._container.appendChild(this._toolbarEl)
    this._buildToolbar()

    this._webviewArea = document.createElement('div')
    this._webviewArea.className = 'preview-webview-area'
    this._container.appendChild(this._webviewArea)

    this._loadingEl = document.createElement('div')
    this._loadingEl.className = 'preview-loading'
    this._container.appendChild(this._loadingEl)

    this._emptyEl = document.createElement('div')
    this._emptyEl.className = 'preview-empty'
    this._emptyEl.innerHTML = '<div class="preview-empty-icon">\u{1F310}</div><div>Open a project to preview</div>'
    this._webviewArea.appendChild(this._emptyEl)
  }

  _buildToolbar() {
    const left = document.createElement('div')
    left.className = 'preview-toolbar-left'
    const devices = [
      { id: 'desktop', icon: '\u{1F4BB}', title: 'Desktop' },
      { id: 'tablet', icon: '\u{1F4F1}', title: 'Tablet (768px)' },
      { id: 'mobile', icon: '\u{1F4F1}', title: 'Mobile (375px)' }
    ]
    for (const d of devices) {
      const btn = document.createElement('button')
      btn.className = 'device-btn' + (d.id === 'desktop' ? ' active' : '')
      btn.dataset.device = d.id
      btn.textContent = d.icon
      btn.title = d.title
      btn.addEventListener('click', () => this._setDevice(d.id, btn))
      left.appendChild(btn)
    }
    this._toolbarEl.appendChild(left)

    this._pathEl = document.createElement('div')
    this._pathEl.className = 'preview-toolbar-center'
    this._pathEl.textContent = '/index.html'
    this._toolbarEl.appendChild(this._pathEl)

    const right = document.createElement('div')
    right.className = 'preview-toolbar-right'

    const btnRefresh = document.createElement('button')
    btnRefresh.className = 'preview-btn'
    btnRefresh.textContent = '\u21BB'
    btnRefresh.title = 'Refresh preview'
    btnRefresh.addEventListener('click', () => this.refresh())
    right.appendChild(btnRefresh)

    const btnBrowser = document.createElement('button')
    btnBrowser.className = 'preview-btn'
    btnBrowser.textContent = '\u{1F310}'
    btnBrowser.title = 'Open in browser'
    btnBrowser.addEventListener('click', () => {
      const url = this._getPreviewUrl()
      if (url) window.api?.shell.openExternal(url)
    })
    right.appendChild(btnBrowser)

    const btnPopout = document.createElement('button')
    btnPopout.className = 'preview-btn'
    btnPopout.textContent = '\u2197'
    btnPopout.title = 'Popout preview'
    btnPopout.addEventListener('click', () => this._openExternalWindow())
    right.appendChild(btnPopout)

    this._frameworkBadge = document.createElement('span')
    this._frameworkBadge.className = 'preview-framework-badge'
    this._frameworkBadge.textContent = 'HTML'
    this._toolbarEl.insertBefore(this._frameworkBadge, this._pathEl)

    this._toolbarEl.appendChild(right)
  }

  async startPreview(projectPath) {
    this._projectPath = projectPath
    this._framework = 'html'
    this._frameworkInfo = null
    this._reactMode = false
    this._vueMode = false
    this._compiledCache.clear()

    try {
      if (LiveFront.Services.framework?.detect) {
        const detected = await LiveFront.Services.framework.detect(projectPath)
        this._framework = detected?.framework || 'html'
        this._frameworkInfo = detected || null
      }
    } catch (e) {
      console.warn('[Preview] Framework detection failed:', e)
    }

    this._setFrameworkBadge(this._framework)

    if (this._framework === 'react') {
      this._reactMode = true
      this._createWebview()
      await this._setReactPreview(this._entryFile)
      return
    }

    if (this._framework === 'vue') {
      this._vueMode = true
      this._createWebview()
      await this._setVuePreview(this._entryFile)
      return
    }

    const result = await LiveFront.Services.preview.start(projectPath)
    if (result.error) { console.error('[Preview] Failed:', result.error); return }
    this._port = result.port
    this._ready = true
    this._createWebview()
    this._loadUrl(this._entryFile)
  }

  async stopPreview() {
    this._stopPolling()
    await LiveFront.Services.preview.stop()
    this._port = 0
    this._ready = false
    if (this._webview) { this._webview.remove(); this._webview = null }
  }

  refresh() {
    if (!this._webview || !this._ready) return

    if (this._reactMode) {
      this.reactRefresh()
      return
    }

    if (this._vueMode) {
      this.vueRefresh()
      return
    }

    this._showLoading(true)
    this._webview.reloadIgnoringCache()
  }

  reactRefresh(filePath) {
    if (!this._webview || !this._ready) return
    if (!this._reactMode) return

    if (filePath && !this._isReactBundleFile(filePath)) return

    this._showLoading(true)
    this._compiledCache.clear()
    this._setReactPreview(this._reactEntry || this._entryFile)
  }

  vueRefresh(filePath) {
    if (!this._webview || !this._ready) return
    if (!this._vueMode) return

    if (filePath && !this._isVueBundleFile(filePath)) return

    this._showLoading(true)
    this._compiledCache.clear()
    this._setVuePreview(this._vueEntry || this._entryFile)
  }

  _isVueBundleFile(filePath) {
    if (!filePath) return false
    if (!this._vueMode) return false

    if (filePath === this._vueEntry) return true
    if (filePath === this._joinProjectPath(this._entryFile)) return true
    if (this._compiledCache.has(filePath)) return true

    return filePath.endsWith('.vue') || filePath.endsWith('.js') || filePath.endsWith('.ts')
  }

  _setFrameworkBadge(framework) {
    if (!this._frameworkBadge) return
    const map = {
      react: { label: 'React', color: '#61dafb' },
      vue: { label: 'Vue', color: '#42b883' },
      svelte: { label: 'Svelte', color: '#ff3e00' },
      html: { label: 'HTML', color: '#9ca3af' }
    }
    const info = map[framework] || map.html
    this._frameworkBadge.textContent = info.label
    this._frameworkBadge.style.color = info.color
    this._frameworkBadge.style.borderColor = info.color
  }

  async _setReactPreview(entryFile) {
    if (!this._webview || !this._projectPath) return
    this._reactEntry = entryFile

    const detectedEntry = await this._detectReactEntry(entryFile)
    this._reactEntry = detectedEntry
    this._entryFile = detectedEntry

    const projectCss = await this._collectProjectCss(this._projectPath)
    const compiledBundle = await this._collectLocalJsxBundle(this._projectPath, detectedEntry)

    if (!compiledBundle) {
      this._showReactError('Failed to compile React entry: ' + detectedEntry)
      return
    }

    const html = this._buildReactPreviewHtml(projectCss, compiledBundle)
    this._webview.srcdoc = html
    this._pathEl.textContent = '/' + this._relativePath(detectedEntry)
    this._ready = true
  }

  async _detectReactEntry(entryFile) {
    const candidateAbsolute = this._joinProjectPath(this._relativePath(entryFile))

    if (await this._fileExists(candidateAbsolute)) return candidateAbsolute

    const candidates = [
      this._joinProjectPath('src', 'index.jsx'),
      this._joinProjectPath('src', 'index.tsx'),
      this._joinProjectPath('src', 'App.jsx'),
      this._joinProjectPath('src', 'App.tsx'),
      this._joinProjectPath('index.jsx'),
      this._joinProjectPath('index.tsx'),
      this._joinProjectPath('src', 'main.jsx'),
      this._joinProjectPath('src', 'main.tsx')
    ]

    for (const c of candidates) {
      if (await this._fileExists(c)) return c
    }

    return candidateAbsolute
  }

  async _collectProjectCss(projectPath) {
    try {
      if (window.api?.fs?.readDirByExt) {
        const cssFiles = await window.api.fs.readDirByExt(projectPath, ['css'])
        const parts = []
        for (const f of (cssFiles || [])) {
          try {
            const content = await this._readProjectFile(f)
            if (content) parts.push(content)
          } catch {}
        }
        return parts.join('\n')
      }
    } catch (e) {
      console.warn('[Preview] Failed to collect CSS:', e)
    }
    return ''
  }

  async _collectLocalJsxBundle(projectPath, entryFile) {
    const visited = new Set()
    const ordered = []

    const walk = async (filePath) => {
      if (visited.has(filePath)) return
      visited.add(filePath)

      const source = await this._readProjectFile(filePath)
      if (!source) return

      const localImports = this._extractLocalImports(source)
      for (const imp of localImports) {
        const resolved = this._resolveLocalImport(projectPath, filePath, imp.raw)
        if (resolved && !visited.has(resolved)) {
          await walk(resolved)
        }
      }

      const compiled = await this._compileReactSource(source, filePath)
      if (compiled) {
        ordered.push({ filePath, code: compiled })
      }
    }

    await walk(entryFile)
    return ordered
  }

  async _compileReactSource(source, filePath) {
    if (!source) return null

    if (this._compiledCache.has(filePath)) {
      return this._compiledCache.get(filePath)
    }

    try {
      let compiled
      if (LiveFront.ReactCompiler?.compile) {
        const result = await LiveFront.ReactCompiler.compile(source, filePath)
        if (result.error) {
          console.warn('[Preview] Compile error in', filePath, result.error)
          return null
        }
        compiled = result.code
      } else {
        compiled = source
      }

      compiled = this._transformImportsToGlobals(compiled)
      this._compiledCache.set(filePath, compiled)
      return compiled
    } catch (e) {
      console.warn('[Preview] Compilation failed for', filePath, e)
      return null
    }
  }

  _transformImportsToGlobals(code) {
    if (LiveFront.ReactCompiler?.transformImportsToGlobals) {
      return LiveFront.ReactCompiler.transformImportsToGlobals(code)
    }
    return code
  }

  _wrapReactModule(moduleName, code) {
    return '(function() { var exports = {}; var module = { exports: exports }; ' + code + '; window["' + moduleName + '"] = module.exports; })();'
  }

  _buildReactPreviewHtml(projectCss, compiledBundle) {
    const styles = projectCss ? '<style>' + projectCss + '</style>' : ''

    let modulesCode = ''
    for (const item of compiledBundle) {
      const moduleName = this._safeModuleName(item.filePath)
      modulesCode += this._wrapReactModule(moduleName, item.code) + '\n'
    }

    const lastModule = this._safeModuleName(compiledBundle[compiledBundle.length - 1].filePath)
    const overlayScript = this._getInjectedOverlayScript()

    return [
      '<!DOCTYPE html>',
      '<html><head><meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      styles,
      '</head><body>',
      '<div id="root"></div>',
      '<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>',
      '<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>',
      '<script>',
      modulesCode,
      '(function() {',
      '  try {',
      '    var AppComponent = window["' + lastModule + '"];',
      '    if (AppComponent && AppComponent.default) AppComponent = AppComponent.default;',
      '    var root = ReactDOM.createRoot(document.getElementById("root"));',
      '    root.render(React.createElement(AppComponent));',
      '  } catch(e) {',
      '    document.getElementById("root").innerHTML = "<pre style=\\"color:red;padding:20px\\">" + e.message + "<br>" + (e.stack || "") + "</pre>";',
      '  }',
      '})();',
      '<\/script>',
      overlayScript,
      '</body></html>'
    ].join('\n')
  }

  _getInjectedOverlayScript() {
    return [
      '<script>',
      '(function() {',
      'var hoveringDiv = null, selectedDiv = null;',
      'function emit(obj) { try { window.__lf_events = window.__lf_events || []; window.__lf_events.push(obj); } catch(e) {} }',
      'function ensureDiv(prop) {',
      '  if (!prop) { prop = {}; }',
      '  var d = document.createElement("div");',
      '  d.style.cssText = "position:absolute;pointer-events:none;z-index:2147483646;";',
      '  document.body.appendChild(d);',
      '  return d;',
      '}',
      'hoveringDiv = ensureDiv(hoveringDiv);',
      'selectedDiv = ensureDiv(selectedDiv);',
      'function cs(s) { return window.getComputedStyle(s); }',
      'function rp(el) { var r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }',
      'function getSelector(el) {',
      '  if (el.id) return "#" + el.id;',
      '  var sel = el.tagName.toLowerCase();',
      '  if (el.className && typeof el.className === "string") sel += "." + el.className.trim().split(/\\s+/).join(".");',
      '  return sel;',
      '}',
      'document.addEventListener("mousemove", function(e) {',
      '  var el = document.elementFromPoint(e.clientX, e.clientY);',
      '  if (!el || el === document.body || el === document.documentElement) return;',
      '  var r = rp(el); hoveringDiv.style.left=r.x+"px"; hoveringDiv.style.top=r.y+"px"; hoveringDiv.style.width=r.w+"px"; hoveringDiv.style.height=r.h+"px"; hoveringDiv.style.outline="2px solid rgba(0,120,215,0.6)";',
      '  var info = { action:"element-hovered", tagName:el.tagName, selector:getSelector(el), rect:r, styles:{ color:cs(el).color, backgroundColor:cs(el).backgroundColor, fontSize:cs(el).fontSize, fontFamily:cs(el).fontFamily, fontWeight:cs(el).fontWeight, lineHeight:cs(el).lineHeight, display:cs(el).display, position:cs(el).position, padding:cs(el).padding, margin:cs(el).margin, border:cs(el).border, borderRadius:cs(el).borderRadius, boxShadow:cs(el).boxShadow, opacity:cs(el).opacity, width:cs(el).width, height:cs(el).height, textAlign:cs(el).textAlign, overflow:cs(el).overflow } };',
      '  window.__lf_hover = info;',
      '  emit(info);',
      '}, true);',
      'document.addEventListener("click", function(e) {',
      '  if (e.button !== 0) return;',
      '  e.preventDefault(); e.stopPropagation();',
      '  var el = document.elementFromPoint(e.clientX, e.clientY);',
      '  if (!el) return;',
      '  var r = rp(el); selectedDiv.style.left=r.x+"px"; selectedDiv.style.top=r.y+"px"; selectedDiv.style.width=r.w+"px"; selectedDiv.style.height=r.h+"px"; selectedDiv.style.outline="2px solid #4a6cf7";',
      '  var info = { action:"element-selected", tagName:el.tagName, selector:getSelector(el), id:el.id, className:el.className, rect:r, styles:{ color:cs(el).color, backgroundColor:cs(el).backgroundColor, fontSize:cs(el).fontSize, fontFamily:cs(el).fontFamily, fontWeight:cs(el).fontWeight, lineHeight:cs(el).lineHeight, display:cs(el).display, position:cs(el).position, padding:cs(el).padding, margin:cs(el).margin, border:cs(el).border, borderRadius:cs(el).borderRadius, boxShadow:cs(el).boxShadow, opacity:cs(el).opacity, width:cs(el).width, height:cs(el).height, textAlign:cs(el).textAlign, overflow:cs(el).overflow } };',
      '  window.__lf_selected = info;',
      '  emit(info);',
      '}, true);',
      'document.addEventListener("keydown", function(e) {',
      '  if (e.key === "Escape") {',
      '    if (selectedDiv) { selectedDiv.style.width="0"; selectedDiv.style.height="0"; }',
      '    emit({ action:"element-deselected" });',
      '  }',
      '});',
      'window.parent.postMessage({ action:"preview-ready" }, "*");',
      'emit({ action:"preview-ready" });',
      '})();',
      '<\/script>'
    ].join('\n')
  }

  _extractLocalImports(source) {
    if (LiveFront.ReactCompiler?.extractLocalImports) {
      return LiveFront.ReactCompiler.extractLocalImports(source)
    }

    const imports = []
    const regex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]\.[^'"]+['"]\s*;?/g
    let match
    while ((match = regex.exec(source))) {
      imports.push({
        raw: match[1] || match[0].replace(/^import\s+.*from\s+/, '').replace(/;?$/, ''),
        statement: match[0]
      })
    }

    return imports
  }

  _resolveLocalImport(projectPath, fromFile, rawImport) {
    if (!rawImport) return null
    if (!rawImport.startsWith('.')) return null

    const normalized = rawImport.replace(/\.(jsx|tsx|ts|js|mjs|cjs|vue)$/i, '')
    const baseDir = fromFile.replace(/[\\/][^\\/]+$/, '')
    const candidate = this._joinProjectPath(this._relativePath(baseDir), normalized)

    const tryExtensions = ['', '.vue', '.jsx', '.tsx', '.ts', '.js']
    for (const ext of tryExtensions) {
      const attempt = candidate + ext
      if (attempt.includes('node_modules') || attempt.includes('.git')) continue
      return attempt
    }

    return candidate
  }

  _isReactBundleFile(filePath) {
    if (!filePath) return false
    if (!this._reactMode) return false

    if (filePath === this._reactEntry) return true
    if (filePath === this._joinProjectPath(this._entryFile)) return true
    if (this._compiledCache.has(filePath)) return true

    return filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.ts')
  }

  _relativePath(absolutePath) {
    if (!absolutePath || !this._projectPath) return absolutePath || ''
    let rel = absolutePath
    if (rel.startsWith(this._projectPath)) {
      rel = rel.slice(this._projectPath.length)
    }
    return rel.replace(/^\\+|^\/+/, '')
  }

  _joinProjectPath(...segments) {
    const joined = segments.filter(Boolean).join('/')
    const normalized = joined.replace(/\\/g, '/').replace(/\/+\//, '/')
    const root = (this._projectPath || '').replace(/[\\/]+$/, '')
    return root + '/' + normalized.replace(/^\//, '')
  }

  _safeModuleName(filePath) {
    return 'mod_' + this._relativePath(filePath).replace(/[^A-Za-z0-9]/g, '_')
  }

  async _fileExists(filePath) {
    try {
      return Boolean(await LiveFront.Services.fileSystem.exists(filePath))
    } catch {
      return false
    }
  }

  async _readProjectFile(filePath) {
    try {
      return await LiveFront.Services.fileSystem.readFile(filePath)
    } catch {
      return null
    }
  }

  _showReactError(message) {
    if (!this._webview) return
    const safe = String(message || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    this._webview.srcdoc = '<!DOCTYPE html><html><body style="padding:24px;font-family:system-ui;color:#ef4444;">' + safe + '</body></html>'
  }

  async _setVuePreview(entryFile) {
    if (!this._webview || !this._projectPath) return
    this._vueEntry = entryFile

    const detectedEntry = await this._detectVueEntry(entryFile)
    this._vueEntry = detectedEntry
    this._entryFile = detectedEntry

    const projectCss = await this._collectProjectCss(this._projectPath)
    const compiledBundle = await this._collectLocalVueBundle(this._projectPath, detectedEntry)

    if (!compiledBundle || compiledBundle.length === 0) {
      this._showVueError('Failed to compile Vue entry: ' + detectedEntry)
      return
    }

    const html = await this._buildVuePreviewHtml(projectCss, compiledBundle)
    this._webview.srcdoc = html
    this._pathEl.textContent = '/' + this._relativePath(detectedEntry)
    this._ready = true
  }

  async _detectVueEntry(entryFile) {
    const candidateAbsolute = this._joinProjectPath(this._relativePath(entryFile))
    if (await this._fileExists(candidateAbsolute)) return candidateAbsolute

    const candidates = [
      this._joinProjectPath('src', 'App.vue'),
      this._joinProjectPath('src', 'main.vue'),
      this._joinProjectPath('src', 'index.vue'),
      this._joinProjectPath('App.vue'),
      this._joinProjectPath('main.vue'),
      this._joinProjectPath('src', 'main.js'),
      this._joinProjectPath('src', 'main.ts'),
      this._joinProjectPath('main.js'),
      this._joinProjectPath('main.ts')
    ]

    for (const c of candidates) {
      if (await this._fileExists(c)) return c
    }
    return candidateAbsolute
  }

  async _collectLocalVueBundle(projectPath, entryFile) {
    const visited = new Set()
    const ordered = []

    const walk = async (filePath) => {
      if (visited.has(filePath)) return
      visited.add(filePath)

      const source = await this._readProjectFile(filePath)
      if (!source) return

      if (filePath.endsWith('.vue')) {
        const compiled = await LiveFront.VueCompiler.compile(source, filePath)
        if (compiled.error) {
          console.warn('[Preview] Vue compile error in', filePath, compiled.error)
          return
        }

        const importBindings = this._extractImportBindings(source)

        for (const dep of compiled.dependencies) {
          const resolved = this._resolveLocalImport(projectPath, filePath, dep.raw)
          if (resolved && !visited.has(resolved)) {
            await walk(resolved)
          }
        }

        ordered.push({
          filePath,
          template: compiled.template,
          script: compiled.script,
          styles: compiled.styles,
          setup: compiled.setup,
          importBindings
        })
      } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        const vueImports = this._extractVueImports(source)
        for (const imp of vueImports) {
          const resolved = this._resolveLocalImport(projectPath, filePath, imp)
          if (resolved && !visited.has(resolved)) {
            await walk(resolved)
          }
        }
      }
    }

    await walk(entryFile)
    return ordered
  }

  _extractImportBindings(source) {
    const bindings = []
    const regex = /import\s+(\w+)\s+from\s+['"]\.\/[^'"]+['"]\s*;?/g
    let match
    while ((match = regex.exec(source))) {
      bindings.push({ name: match[1], type: 'default' })
    }
    const destrRegex = /import\s+\{([^}]+)\}\s+from\s+['"]\.\/[^'"]+['"]\s*;?/g
    while ((match = destrRegex.exec(source))) {
      const names = match[1].split(',').map(n => n.trim()).filter(Boolean)
      for (const name of names) {
        bindings.push({ name, type: 'named' })
      }
    }
    return bindings
  }

  _extractVueImports(source) {
    const imports = []
    const regex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"](\.\/[^'"]*\.vue)['"]\s*;?/g
    let match
    while ((match = regex.exec(source))) {
      imports.push(match[1])
    }
    return imports
  }

  async _fetchVueRuntime() {
    if (this._vueRuntimeCache) return this._vueRuntimeCache
    try {
      const resp = await fetch('https://unpkg.com/vue@3/dist/vue.global.js')
      if (!resp.ok) throw new Error('HTTP ' + resp.status)
      this._vueRuntimeCache = await resp.text()
    } catch (e) {
      console.warn('[Preview] Failed to fetch Vue runtime from CDN:', e)
      this._vueRuntimeCache = 'console.error("Vue runtime failed to load");'
    }
    return this._vueRuntimeCache
  }

  async _buildVuePreviewHtml(projectCss, compiledBundle) {
    const allStyles = [projectCss]
    const componentDefs = []
    let entryComponentName = null

    for (const comp of compiledBundle) {
      for (const s of (comp.styles || [])) {
        allStyles.push(s)
      }

      const componentName = this._getVueComponentName(comp.filePath)

      if (comp.setup) {
        const setupCode = [
          'const ' + componentName + ' = {',
          '  setup: (function() {',
          comp.script.split('\n').map(l => '    ' + l).join('\n'),
          '    return function() {',
          '      return { ' + this._extractSetupBindings(comp.script) + ' }',
          '    }',
          '  })(),',
          '  template: ' + JSON.stringify(comp.template),
          '}'
        ].join('\n')
        componentDefs.push(setupCode)
      } else {
        const optCode = [
          'const ' + componentName + ' = (function() {',
          comp.script.split('\n').map(l => '  ' + l).join('\n'),
          '  return Object.assign({}, typeof __default !== "undefined" ? __default : {}, { template: ' + JSON.stringify(comp.template) + ' })',
          '})()'
        ].join('\n')
        componentDefs.push(optCode)
      }

      if (comp.importBindings && comp.importBindings.length > 0) {
        const aliasLines = comp.importBindings.map(b => {
          const globalName = this._getVueComponentNameByBase(b.name)
          return 'var ' + b.name + ' = ' + globalName + ';'
        }).join('\n')
        componentDefs.push(aliasLines)
      }

      if (comp.filePath === this._vueEntry || !entryComponentName) {
        entryComponentName = componentName
      }
    }

    const componentNames = compiledBundle.map(comp => this._getVueComponentName(comp.filePath))
    const componentsMapEntries = componentNames.map(n => "'" + n.replace(/^Vue/, '') + "': " + n).join(', ')

    const overlayScript = this._getInjectedOverlayScript()
    const styles = allStyles.filter(Boolean).map(s => '<style>' + s + '</style>').join('\n')

    const vueRuntimeCode = await this._fetchVueRuntime()

    return [
      '<!DOCTYPE html>',
      '<html><head><meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      styles,
      '</head><body>',
      '<div id="app"></div>',
      '<script>',
      vueRuntimeCode,
      '<\/script>',
      '<script>',
      componentDefs.join('\n\n'),
      '\nconst App = {',
      '  components: { ' + componentsMapEntries + ' },',
      "  template: '<" + entryComponentName + " />'",
      '}',
      'try {',
      "  const app = Vue.createApp(App)",
      "  app.mount('#app')",
      '} catch(e) {',
      '  document.getElementById("app").innerHTML = "<pre style=\\"color:red;padding:20px\\">" + e.message + "\\n" + (e.stack || "") + "</pre>";',
      '}',
      '<\/script>',
      overlayScript,
      '</body></html>'
    ].join('\n')
  }

  _getVueComponentNameByBase(baseName) {
    return 'Vue' + baseName.charAt(0).toUpperCase() + baseName.slice(1)
  }

  _getVueComponentName(filePath) {
    const name = filePath.split(/[\\/]/).pop().replace(/\.vue$/, '')
    return 'Vue' + name.charAt(0).toUpperCase() + name.slice(1)
  }

  _extractSetupBindings(script) {
    const bindings = []
    const regex = /(?:const|let|var)\s+(\w+)\s*=/g
    let match
    while ((match = regex.exec(script))) {
      bindings.push(match[1])
    }
    const funcRegex = /function\s+(\w+)\s*\(/g
    while ((match = funcRegex.exec(script))) {
      bindings.push(match[1])
    }
    return bindings.join(', ')
  }

  _showVueError(message) {
    if (!this._webview) return
    const safe = String(message || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    this._webview.srcdoc = '<!DOCTYPE html><html><body style="padding:24px;font-family:system-ui;color:#ef4444;">' +
      safe + '</body></html>'
  }

  _createWebview() {
    if (this._emptyEl) { this._emptyEl.remove(); this._emptyEl = null }

    this._wrapperEl = document.createElement('div')
    this._wrapperEl.className = 'preview-webview-wrapper'
    this._wrapperEl.style.width = this._deviceWidths[this._device]

    this._webview = document.createElement('webview')
    this._webview.setAttribute('preload', '')
    this._webview.setAttribute('allowpopups', '')
    this._webview.partition = 'persist:preview'

    this._wrapperEl.appendChild(this._webview)
    this._webviewArea.appendChild(this._wrapperEl)

    this._webview.addEventListener('did-finish-load', () => {
      this._showLoading(false)
      this._startPolling()
    })

    this._webview.addEventListener('did-fail-load', (e) => {
      this._showLoading(false)
      if (e.errorCode !== -3) console.warn('[Preview] Load failed:', e.errorDescription)
    })

    this._webview.addEventListener('console-message', (e) => {
      LiveFront.EventBus.emit('preview:console', {
        level: e.level === 2 ? 'error' : e.level === 1 ? 'warn' : 'log',
        message: e.message, line: e.line
      })
    })
  }

  _startPolling() {
    this._stopPolling()
    if (!this._webview) return

    this._pollTimer = setInterval(() => {
      if (!this._webview) { this._stopPolling(); return }

      const code = `(function() {
        var events = window.__lf_events || [];
        window.__lf_events = [];
        return JSON.stringify(events);
      })()`

      this._webview.executeJavaScript(code).then((jsonStr) => {
        if (!jsonStr) return
        let events
        try { events = JSON.parse(jsonStr) } catch { return }
        for (const ev of events) {
          this._handleEvent(ev)
        }
      }).catch(() => {})
    }, 100)
  }

  _stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer)
      this._pollTimer = null
    }
  }

  _handleEvent(ev) {
    console.log('[Preview] _handleEvent received:', ev.action, ev.selector || '');
    if (ev.action === 'element-selected') {
      LiveFront.state.selectedElement = ev
      LiveFront.EventBus.emit('element:selected', ev)
      this._jumpToElement(ev)
    } else if (ev.action === 'element-deselected') {
      LiveFront.state.selectedElement = null
      LiveFront.EventBus.emit('element:deselected')
    } else if (ev.action === 'preview-ready') {
      LiveFront.EventBus.emit('preview:ready')
    } else if (ev.action === 'console') {
      LiveFront.EventBus.emit('preview:console', {
        level: ev.level, message: ev.content, timestamp: ev.timestamp
      })
    }
  }

  _jumpToElement(info) {
    let searchText = ''
    if (info.id) {
      searchText = 'id="' + info.id + '"'
    } else if (info.className && typeof info.className === 'string') {
      const firstClass = info.className.trim().split(/\s+/)[0]
      if (firstClass) searchText = 'class="' + firstClass
    }
    if (!searchText) return

    const editor = LiveFront.Editor?.getActiveEditor()
    if (!editor) return
    const model = editor.getModel()
    if (!model) return

    const matches = model.findMatches(searchText, false, false, false, null, true)
    if (matches.length > 0) {
      const line = matches[0].range.startLineNumber
      editor.revealLineInCenter(line)
      editor.setPosition({ lineNumber: line, column: 1 })
      const deco = editor.deltaDecorations([], [{
        range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: model.getLineMaxColumn(line) },
        options: { className: 'editor-line-highlight-decoration', isWholeLine: true }
      }])
      setTimeout(() => editor.deltaDecorations(deco, []), 2000)
    }
  }

  _loadUrl(entryFile) {
    if (!this._webview || !this._port) return
    const url = 'http://127.0.0.1:' + this._port + entryFile
    this._showLoading(true)
    this._webview.src = url
    this._pathEl.textContent = entryFile
  }

  _getPreviewUrl() {
    if (!this._port) return ''
    return 'http://127.0.0.1:' + this._port + this._entryFile
  }

  _setDevice(device, btn) {
    this._device = device
    this._toolbarEl.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    if (this._wrapperEl) this._wrapperEl.style.width = this._deviceWidths[device]
  }

  _openExternalWindow() {
    const url = this._getPreviewUrl()
    if (url) LiveFront.Services.preview.openExternalWindow(url)
  }

  _showLoading(show) {
    if (this._loadingEl) this._loadingEl.classList.toggle('active', show)
  }

  getWebview() { return this._webview }
  getPort() { return this._port }
  getProjectPath() { return this._projectPath }
}

window.LiveFront.Preview = new PreviewManager()
