const fs = require('fs');
let c = fs.readFileSync('.tmp_preview_orig.js', 'utf8');

c = c.replace(
  '    this._pollTimer = null\n  }',
  [
    '    this._pollTimer = null',
    '    this._framework = \'html\'',
    '    this._frameworkInfo = null',
    '    this._badgeEl = null',
    '    this._reactMode = false',
    '    this._compiledCache = new Map()',
    '  }'
  ].join('\n')
);

c = c.replace(
  '    this._toolbarEl.appendChild(right)\n  }\n\n  async startPreview',
  [
    "    this._frameworkBadge = document.createElement('span')",
    "    this._frameworkBadge.className = 'preview-framework-badge'",
    "    this._frameworkBadge.textContent = 'HTML'",
    '    this._toolbarEl.insertBefore(this._frameworkBadge, this._pathEl)',
    '',
    '    this._toolbarEl.appendChild(right)',
    '  }',
    '',
    '  async startPreview'
  ].join('\n')
);

c = c.replace(
  "  async startPreview(projectPath) {\n    this._projectPath = projectPath\n    const result = await LiveFront.Services.preview.start(projectPath)\n    if (result.error) { console.error('[Preview] Failed:', result.error); return }\n    this._port = result.port\n    this._ready = true\n    this._createWebview()\n    this._loadUrl(this._entryFile)\n  }",
  [
    '  async startPreview(projectPath) {',
    '    this._projectPath = projectPath',
    '    this._framework = \'html\'',
    '    this._frameworkInfo = null',
    '    this._reactMode = false',
    '    this._compiledCache.clear()',
    '',
    '    try {',
    '      if (LiveFront.Services.framework?.detect) {',
    '        const detected = await LiveFront.Services.framework.detect(projectPath)',
    "        this._framework = detected?.framework || 'html'",
    '        this._frameworkInfo = detected || null',
    '      }',
    '    } catch (e) {',
    "      console.warn('[Preview] Framework detection failed:', e)",
    '    }',
    '',
    '    this._setFrameworkBadge(this._framework)',
    '',
    "    if (this._framework === 'react') {",
    '      this._reactMode = true',
    '      this._createWebview()',
    '      await this._setReactPreview(this._entryFile)',
    '      return',
    '    }',
    '',
    '    const result = await LiveFront.Services.preview.start(projectPath)',
    "    if (result.error) { console.error('[Preview] Failed:', result.error); return }",
    '    this._port = result.port',
    '    this._ready = true',
    '    this._createWebview()',
    '    this._loadUrl(this._entryFile)',
    '  }'
  ].join('\n')
);

c = c.replace(
  '  refresh() {\n    if (!this._webview || !this._ready) return\n    this._showLoading(true)\n    this._webview.reloadIgnoringCache()\n  }',
  [
    '  refresh() {',
    '    if (!this._webview || !this._ready) return',
    '',
    '    if (this._reactMode) {',
    '      this.reactRefresh()',
    '      return',
    '    }',
    '',
    '    this._showLoading(true)',
    '    this._webview.reloadIgnoringCache()',
    '  }',
    '',
    '  reactRefresh(filePath) {',
    '    if (!this._webview || !this._ready) return',
    '    if (!this._reactMode) return',
    '',
    '    if (filePath && !this._isReactBundleFile(filePath)) return',
    '',
    '    this._showLoading(true)',
    '    this._compiledCache.clear()',
    '    this._setReactPreview(this._reactEntry || this._entryFile)',
    '  }',
    '',
    '  _setFrameworkBadge(framework) {',
    '    if (!this._frameworkBadge) return',
    '    const map = {',
    "      react: { label: 'React', color: '#61dafb' },",
    "      vue: { label: 'Vue', color: '#42b883' },",
    "      svelte: { label: 'Svelte', color: '#ff3e00' },",
    "      html: { label: 'HTML', color: '#9ca3af' }",
    '    }',
    '    const info = map[framework] || map.html',
    '    this._frameworkBadge.textContent = info.label',
    '    this._frameworkBadge.style.color = info.color',
    '    this._frameworkBadge.style.borderColor = info.color',
    '  }',
    '',
    '  async _setReactPreview(entryFile) {',
    '    if (!this._webview || !this._projectPath) return',
    '    this._reactEntry = entryFile',
    '',
    '    const detectedEntry = await this._detectReactEntry(entryFile)',
    '    this._reactEntry = detectedEntry',
    '    this._entryFile = detectedEntry',
    '',
    '    const projectCss = await this._collectProjectCss(this._projectPath)',
    '    const compiledBundle = await this._collectLocalJsxBundle(this._projectPath, detectedEntry)',
    '',
    '    if (!compiledBundle) {',
    "      this._showReactError('Failed to compile React entry: ' + detectedEntry)",
    '      return',
    '    }',
    '',
    '    const html = this._buildReactPreviewHtml(projectCss, compiledBundle)',
    '    this._webview.srcdoc = html',
    "    this._pathEl.textContent = '/' + this._relativePath(detectedEntry)",
    '  }',
    '',
    '  async _detectReactEntry(entryFile) {',
    '    const candidateAbsolute = this._joinProjectPath(entryFile)',
    '',
    '    if (await this._fileExists(candidateAbsolute)) {',
    '      return candidateAbsolute',
    '    }',
    '',
    '    const tryPaths = [',
    "      this._joinProjectPath('/src/index.jsx'),",
    "      this._joinProjectPath('/src/index.tsx'),",
    "      this._joinProjectPath('/src/App.jsx'),",
    "      this._joinProjectPath('/src/App.tsx'),",
    "      this._joinProjectPath('/index.jsx'),",
    "      this._joinProjectPath('/index.tsx'),",
    "      this._joinProjectPath('/index.html')",
    '    ]',
    '',
    '    for (const filePath of tryPaths) {',
    '      if (await this._fileExists(filePath)) return filePath',
    '    }',
    '',
    '    return candidateAbsolute',
    '  }',
    '',
    '  async _collectProjectCss(projectPath) {',
    '    const cssPaths = []',
    '',
    '    try {',
    "      const found = await LiveFront.ipc.invoke('fs:read-dir-by-ext', projectPath, ['css'])",
    '      if (Array.isArray(found)) {',
    '        for (const filePath of found) {',
    "          if (!filePath.includes('node_modules') && !filePath.includes('.git')) {",
    '            cssPaths.push(filePath)',
    '          }',
    '        }',
    '      }',
    '    } catch (e) {',
    "      console.warn('[Preview] Failed to collect project CSS:', e)",
    '    }',
    '',
    '    return cssPaths.slice(0, 40)',
    '  }',
    '',
    '  async _collectLocalJsxBundle(projectPath, entryFile) {',
    '    const collected = new Map()',
    '',
    '    const collect = async (filePath) => {',
    '      if (!filePath) return',
    '      if (collected.has(filePath)) return',
    '',
    '      const ext = this._ext(filePath)',
    "      if (!['jsx', 'tsx', 'ts', 'js'].includes(ext)) return",
    "      if (filePath.includes('node_modules') || filePath.includes('.git')) return",
    '',
    '      const content = await this._readProjectFile(filePath)',
    '      if (content === null) return',
    '',
    '      collected.set(filePath, content)',
    '',
    '      const imports = this._extractLocalImports(content)',
    '      for (const importInfo of imports) {',
    '        const resolved = this._resolveLocalImport(this._projectPath, filePath, importInfo.raw)',
    '        if (resolved) {',
    '          await collect(resolved)',
    '        }',
    '      }',
    '    }',
    '',
    '    await collect(entryFile)',
    '',
    '    if (collected.size === 0) return null',
    '',
    '    const ordered = Array.from(collected.entries())',
    '    const compiledChunks = []',
    '',
    '    for (const [filePath, content] of ordered) {',
    '      const compiled = await this._compileReactSource(filePath, content)',
    '      if (!compiled) return null',
    '      const wrapped = this._wrapReactModule(filePath, entryFile, compiled)',
    '      compiledChunks.push(wrapped)',
    '    }',
    '',
    '    const mainComponent = this._getMainComponentName(entryFile, collected.get(entryFile))',
    "    compiledChunks.push('window.__LF_MainComponent = ' + mainComponent + ';')",
    '',
    "    return compiledChunks.join('\\n\\n')",
    '  }',
    '',
    '  async _compileReactSource(filePath, content) {',
    '    if (this._compiledCache.has(filePath)) {',
    '      return this._compiledCache.get(filePath)',
    '    }',
    '',
    '    const ext = this._ext(filePath)',
    "    if (ext === 'js') {",
    '      this._compiledCache.set(filePath, content)',
    '      return content',
    '    }',
    '',
    '    if (!LiveFront.ReactCompiler?.compile) return null',
    '    const result = await LiveFront.ReactCompiler.compile(content, filePath)',
    '    if (result.error || !result.code) return null',
    '',
    '    const normalized = this._transformImportsToGlobals(result.code)',
    '    this._compiledCache.set(filePath, normalized)',
    '    return normalized',
    '  }',
    '',
    '  _transformImportsToGlobals(code) {',
    '    if (LiveFront.ReactCompiler?.transformImportsToGlobals) {',
    '      return LiveFront.ReactCompiler.transformImportsToGlobals(code)',
    '    }',
    '',
    '    let result = code',
    '    result = result.replace(',
    "      /import\\s+\\{([^}]+)\\}\\s+from\\s+['\"](?:react-dom\\/client|react-dom|react)['\"]\\s*;?/g,",
    '      (_, names) => {',
    "        const trimmed = names.split(',').map(n => n.trim()).filter(Boolean).join(', ')",
    "        return ' + '' + const {  } = window.ReactDOM; + '' + ';",
    '      }',
    '    )',
    '',
    '    result = result.replace(',
    "      /import\\s+(\\w+)\\s+from\\s+['\"](?:react-dom\\/client|react-dom|react)['\"]\\s*;?/g,",
    "      (_, name) => ' + '' + const  = window.React; + '' + ';",
    '    )',
    '',
    '    result = result.replace(',
    "      /import\\s+\\{([^}]+)\\}\\s+from\\s+['\"]react['\"]\\s*;?/g,",
    '      (_, names) => {',
    "        const trimmed = names.split(',').map(n => n.trim()).filter(Boolean).join(', ')",
    "        return ' + '' + const {  } = window.React; + '' + ';",
    '      }',
    '    )',
    '',
    '    result = result.replace(',
    "      /import\\s+(\\w+)\\s+from\\s+['\"]react['\"]\\s*;?/g,",
    "      (_, name) => ' + '' + const  = window.React; + '' + ';",
    '    )',
    '',
    '    result = result.replace(',
    "      /import\\s+(\\w+)\\s+from\\s+['\"]react-dom\\/client['\"]\\s*;?/g,",
    "      (_, name) => ' + '' + const  = window.ReactDOM; + '' + ';",
    '    )',
    '',
    '    result = result.replace(',
    "      /import\\s+\\{([^}]+)\\}\\s+from\\s+['\"]react-dom\\/client['\"]\\s*;?/g,",
    '      (_, names) => {',
    "        const trimmed = names.split(',').map(n => n.trim()).filter(Boolean).join(', ')",
    "        return ' + '' + const {  } = window.ReactDOM; + '' + ';",
    '      }',
    '    )',
    '',
    '    return result',
    '  }',
    '',
    '  _wrapReactModule(filePath, entryFile, compiledCode) {',
    '    const moduleId = this._safeModuleName(filePath)',
    '    return [',
    '      \'(function(window, React, ReactDOM){\',',
    '      \'try {\',',
    '      compiledCode,',
    '      \'} catch (e) {\',',
    '      \'  console.error(\"[LiveFront] Component error in \' + this._escapeJs(filePath) + \':\", e);\',',
    '      \'}\',',
    '      \'})((function(){\',',
    '      \'  var exports = {};\',',
    '      \'  var module = { exports: exports };\',',
    "      '  return { exports: exports, module: module, __LF_define__: function(m){ exports.default = m; } };',",
    '      \'})(), window.React, window.ReactDOM);\'',
    "    ].join('\\n')",
    '  }',
    '',
    '  _getMainComponentName(entryFile, source) {',
    "    if (!source) return 'App'",
    '',
    "    const functionMatches = source.match(/function\\s+([A-Z][A-Za-z0-9_]*)\\s*\\(/g) || []",
    '    if (functionMatches.length > 0) {',
    '      const last = functionMatches[functionMatches.length - 1]',
    "      const name = last.replace(/function\\s+/, '').replace(/\\s*\\(/, '')",
    '      if (name) return name',
    '    }',
    '',
    "    const arrowMatches = source.match(/(?:const|let|var)\\s+([A-Z][A-Za-z0-9_]*)\\s*=\\s*(?:\\([^)]*\\)|[A-Za-z0-9_]+)\\s*=>/g) || []",
    '    if (arrowMatches.length > 0) {',
    '      const last = arrowMatches[arrowMatches.length - 1]',
    "      const name = last.replace(/(?:const|let|var)\\s+/, '').replace(/\\s*=.*/, '')",
    '      if (name) return name',
    '    }',
    '',
    "    return 'App'",
    '  }',
    '',
    '  _buildReactPreviewHtml(projectCss, compiledBundle) {',
    '    const cssTags = projectCss',
    '      .map((cssPath) => {',
    '        const href = this._toPreviewHref(this._relativePath(cssPath))',
    "        return '<link rel=\"stylesheet\" href=\"' + href + '\">'",
    '      })',
    "      .join('\\n    ')",
    '',
    '    return ' + '' + <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <style>
    html, body { margin: 0; padding: 0; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

  <script>
    try {
      

      var MainComponent = window.__LF_MainComponent;
      if (!MainComponent) {
        throw new Error('Main component not found');
      }

      var root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(MainComponent));
    } catch (error) {
      console.error('[LiveFront] React render error:', error);
      document.getElementById('root').innerHTML = '<div style="padding:24px;font-family:system-ui;color:#ef4444;"><h2>React Preview Error</h2><pre style="white-space:pre-wrap;">' + error.message + '</pre></div>';
    }
  </script>

  
</body>
</html> + ';,
    '  }',
    '',
    '  _getInjectedOverlayScript() {',
    '    return ' + '' + <script>
(function() {
  window.__lf_events = [];
  window.__lf_selected = null;
  function emit(d) { window.__lf_events.push(d); try { window.parent.postMessage(d, '*'); } catch(e) {} }
  function overlay(type) {
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;transition:all 80ms ease;border:2px dashed ' + (type==='hover'?'rgba(74,108,247,0.4)':'rgba(74,108,247,0.8)') + ';background:' + (type==='hover'?'rgba(74,108,247,0.06)':'rgba(74,108,247,0.1)') + ';';
    document.body.appendChild(d);
    return d;
  }
  function bubble() {
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;font-family:system-ui,sans-serif;font-size:11px;padding:3px 8px;background:#1a1a24;color:#e4e4e7;border:1px solid rgba(255,255,255,0.1);border-radius:4px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);';
    document.body.appendChild(d);
    return d;
  }
  var hoverDiv = null, selectedDiv = null, bubbleDiv = null, picking = true;
  document.addEventListener('mouseover', function(e) {
    if (!picking) return;
    var el = e.target;
    if (el === document.body || el === document.documentElement) return;
    if (el.style && el.style.position === 'fixed' && el.style.pointerEvents === 'none') return;
    if (!hoverDiv) hoverDiv = overlay('hover');
    var r = el.getBoundingClientRect();
    hoverDiv.style.left = r.left+'px'; hoverDiv.style.top = r.top+'px'; hoverDiv.style.width = r.width+'px'; hoverDiv.style.height = r.height+'px';
    if (!bubbleDiv) bubbleDiv = bubble();
    bubbleDiv.style.display = 'block';
    bubbleDiv.style.left = r.left+'px'; bubbleDiv.style.top = (r.top-24)+'px';
    bubbleDiv.textContent = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\\\s+/)[0] : '');
  });
  document.addEventListener('mouseout', function() {
    if (hoverDiv) { hoverDiv.style.width='0'; hoverDiv.style.height='0'; }
    if (bubbleDiv) bubbleDiv.style.display='none';
  });
  document.addEventListener('click', function(e) {
    if (!picking) return;
    var el = e.target;
    if (el === document.body || el === document.documentElement) return;
    if (el.style && el.style.position === 'fixed' && el.style.pointerEvents === 'none') return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (!selectedDiv) selectedDiv = overlay('selected');
    var r = el.getBoundingClientRect();
    selectedDiv.style.left = r.left+'px'; selectedDiv.style.top = r.top+'px'; selectedDiv.style.width = r.width+'px'; selectedDiv.style.height = r.height+'px';
    var cs = getComputedStyle(el);
    var info = {
      action:'element-selected', tagName:el.tagName,
      className:(el.className && typeof el.className==='string') ? el.className : '',
      id:el.id||'', selector:(function(){ if(el.id) return '#'+el.id; var s=el.tagName.toLowerCase(); if(el.className && typeof el.className==='string'){ var c=el.className.trim().split(/\\\\s+/).join('.'); if(c) s+='.'+c; } return s; })(),
      outerHTML:(el.outerHTML||'').substring(0,2000),
      textContent:(el.textContent||'').substring(0,500),
      rect:{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)},
      computedStyles:{ color:cs.color, backgroundColor:cs.backgroundColor, fontSize:cs.fontSize, fontFamily:cs.fontFamily, fontWeight:cs.fontWeight, lineHeight:cs.lineHeight, display:cs.display, position:cs.position, padding:cs.padding, margin:cs.margin, border:cs.border, borderRadius:cs.borderRadius, boxShadow:cs.boxShadow, opacity:cs.opacity, width:cs.width, height:cs.height, textAlign:cs.textAlign, overflow:cs.overflow }
    };
    window.__lf_selected = info;
    emit(info);
  }, true);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (selectedDiv) { selectedDiv.style.width='0'; selectedDiv.style.height='0'; }
      emit({ action:'element-deselected' });
    }
  });
  window.parent.postMessage({ action:'preview-ready' }, '*');
  emit({ action:'preview-ready' });
})();
</script> + ';,
    '  }',
    '',
    '  _extractLocalImports(source) {',
    '    if (LiveFront.ReactCompiler?.extractLocalImports) {',
    '      return LiveFront.ReactCompiler.extractLocalImports(source)',
    '    }',
    '',
    '    const imports = []',
    "    const regex = /import\\\\s+(?:(?:\\\\{[^}]*\\\\}|\\\\*\\\\s+as\\\\s+\\\\w+|\\\\w+)\\\\s+from\\\\s+)?['\"]\\\\.[^'\"]+['\"]\\\\s*;?/g",
    '    let match',
    '    while ((match = regex.exec(source))) {',
    '      imports.push({',
    "        raw: match[1] || match[0].replace(/^import\\\\s+.*from\\\\s+/, '').replace(/;?$/, ''),",
    '        statement: match[0]',
    '      })',
    '    }',
    '',
    '    return imports',
    '  }',
    '',
    '  _resolveLocalImport(projectPath, fromFile, rawImport) {',
    '    if (!rawImport) return null',
    "    if (!rawImport.startsWith('.')) return null",
    '',
    "    const normalized = rawImport.replace(/\\.(jsx|tsx|ts|js|mjs|cjs)$/i, '')",
    "    const baseDir = fromFile.replace(/[\\\\/][^\\\\/]+$/, '')",
    '    const candidate = this._joinProjectPath(this._relativePath(baseDir), normalized)',
    '',
    "    const tryExtensions = ['', '.jsx', '.tsx', '.ts', '.js']",
    '    for (const ext of tryExtensions) {',
    '      const attempt = candidate + ext',
    "      if (attempt.includes('node_modules') || attempt.includes('.git')) continue",
    '      return attempt',
    '    }',
    '',
    '    return candidate',
    '  }',
    '',
    '  _isReactBundleFile(filePath) {',
    '    if (!filePath) return false',
    '    if (!this._reactMode) return false',
    '',
    '    if (filePath === this._reactEntry) return true',
    '    if (filePath === this._joinProjectPath(this._entryFile)) return true',
    '    if (this._compiledCache.has(filePath)) return true',
    '',
    "    return filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.ts')",
    '  }',
    '',
    '  _toPreviewHref(relativePath) {',
    "    if (!relativePath) return ''",
    "    return './' + relativePath.replace(/\\\\\\\\/g, '/').replace(/^\\.\\//, '')",
    '  }',
    '',
    '  _relativePath(absolutePath) {',
    "    if (!absolutePath || !this._projectPath) return absolutePath || ''",
    '    let rel = absolutePath',
    '    if (rel.startsWith(this._projectPath)) {',
    '      rel = rel.slice(this._projectPath.length)',
    '    }',
    "    return rel.replace(/^\\\\\\\\+|^\\/+/, '')",
    '  }',
    '',
    '  _joinProjectPath(...segments) {',
    "    const joined = segments.filter(Boolean).join('/')",
    "    const normalized = joined.replace(/\\\\\\\\/g, '/').replace(/\\/+\\//, '/')",
    "    const root = (this._projectPath || '').replace(/[\\/\\\\]+$/, '')",
    "    return root + '/' + normalized.replace(/^\\//, '')",
    '  }',
    '',
    '  _safeModuleName(filePath) {',
    "    return 'mod_' + this._relativePath(filePath).replace(/[^A-Za-z0-9]/g, '_')",
    '  }',
    '',
    '  _escapeJs(value) {',
    "    return String(value || '').replace(/\\\\\\\\/g, '\\\\\\\\\\\\').replace(/'/g, \"\\\\\\\\'\")",
    '  }',
    '',
    '  _ext(filePath) {',
    "    return (filePath || '').split('.').pop().toLowerCase()",
    '  }',
    '',
    '  async _fileExists(filePath) {',
    '    try {',
    '      return Boolean(await LiveFront.Services.fileSystem.exists(filePath))',
    '    } catch {',
    '      return false',
    '    }',
    '  }',
    '',
    '  async _readProjectFile(filePath) {',
    '    try {',
    '      return await LiveFront.Services.fileSystem.readFile(filePath)',
    '    } catch {',
    '      return null',
    '    }',
    '  }',
    '',
    '  _showReactError(message) {',
    '    if (!this._webview) return',
    "    const safe = String(message || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')",
    "    this._webview.srcdoc =  + '' + <!DOCTYPE html><html><body style="padding:24px;font-family:system-ui;color:#ef4444;"> + '' +  + safe +  + '' + </body></html> + '' + ",
    '  }',
  ].join('\n')
);

fs.writeFileSync('src/renderer/modules/preview/preview.js', c, 'utf8');
