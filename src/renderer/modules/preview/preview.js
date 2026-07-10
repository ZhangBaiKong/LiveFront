/* LiveFront Preview Manager — 预览区管理器 */
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
  }

  init(containerEl) {
    this._container = containerEl
    this._container.innerHTML = ''
    this._container.className = 'preview-container'

    // 工具栏
    this._toolbarEl = document.createElement('div')
    this._toolbarEl.className = 'preview-toolbar'
    this._container.appendChild(this._toolbarEl)
    this._buildToolbar()

    // WebView 区域
    this._webviewArea = document.createElement('div')
    this._webviewArea.className = 'preview-webview-area'
    this._container.appendChild(this._webviewArea)

    // 加载指示器
    this._loadingEl = document.createElement('div')
    this._loadingEl.className = 'preview-loading'
    this._container.appendChild(this._loadingEl)

    // 空状态
    this._emptyEl = document.createElement('div')
    this._emptyEl.className = 'preview-empty'
    this._emptyEl.innerHTML = '<div class="preview-empty-icon">🌐</div><div>打开项目后显示预览</div>'
    this._webviewArea.appendChild(this._emptyEl)
  }

  _buildToolbar() {
    const left = document.createElement('div')
    left.className = 'preview-toolbar-left'
    const devices = [
      { id: 'desktop', icon: '🖥️', title: '桌面' },
      { id: 'tablet', icon: '📱', title: '平板 (768px)' },
      { id: 'mobile', icon: '📲', title: '手机 (375px)' }
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
    btnRefresh.textContent = '↻'
    btnRefresh.title = '刷新预览'
    btnRefresh.addEventListener('click', () => this.refresh())
    right.appendChild(btnRefresh)

    const btnBrowser = document.createElement('button')
    btnBrowser.className = 'preview-btn'
    btnBrowser.textContent = '🌐'
    btnBrowser.title = '在浏览器中打开'
    btnBrowser.addEventListener('click', () => {
      const url = this._getPreviewUrl()
      if (url) window.api?.shell.openExternal(url)
    })
    right.appendChild(btnBrowser)

    const btnPopout = document.createElement('button')
    btnPopout.className = 'preview-btn'
    btnPopout.textContent = '⬜'
    btnPopout.title = '独立窗口预览'
    btnPopout.addEventListener('click', () => this._openExternalWindow())
    right.appendChild(btnPopout)

    this._toolbarEl.appendChild(right)
  }

  async startPreview(projectPath) {
    this._projectPath = projectPath
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
    this._showLoading(true)
    this._webview.reloadIgnoringCache()
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
      // 启动 __lf_events 轮询
      this._startPolling()
    })

    this._webview.addEventListener('did-fail-load', (e) => {
      this._showLoading(false)
      if (e.errorCode !== -3) console.warn('[Preview] Load failed:', e.errorDescription)
    })

    // console-message 事件
    this._webview.addEventListener('console-message', (e) => {
      LiveFront.EventBus.emit('preview:console', {
        level: e.level === 2 ? 'error' : e.level === 1 ? 'warn' : 'log',
        message: e.message, line: e.line
      })
    })
  }

  // ── 核心：轮询 webview 中的 __lf_events 队列 ──
  _startPolling() {
    this._stopPolling()
    if (!this._webview) return

    this._pollTimer = setInterval(() => {
      if (!this._webview) { this._stopPolling(); return }

      // 读取并清空事件队列
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
      }).catch(() => {
        // webview 可能还没加载完成，忽略
      })
    }, 100) // 每 100ms 轮询一次
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
      // 高亮该行 2 秒
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