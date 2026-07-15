/* LiveFront Editor — Tab 栏管理器 */
window.LiveFront = window.LiveFront || {}

class TabBar {
  constructor() {
    this._container = null  // Tab 栏 DOM 容器
    this._tabs = []         // [{ path, name, dirty, element }]
    this._activePath = null
  }

  // ── 初始化 ──
  init(containerEl) {
    this._container = containerEl
    this._container.className = 'editor-tab-bar'
    this._container.innerHTML = ''
    this._renderEmpty()
  }

  // ── 添加 Tab ──
  addTab(path, name, dirty) {
    if (this._tabs.find(t => t.path === path)) {
      this.activateTab(path)
      return
    }

    // 清除空状态
    this._clearEmpty()

    const tab = {
      path,
      name,
      dirty: !!dirty,
      element: null
    }
    tab.element = this._createTabElement(tab)
    this._tabs.push(tab)
    this._container.appendChild(tab.element)
    this.activateTab(path)
  }

  // ── 移除 Tab ──
  removeTab(path) {
    const idx = this._tabs.findIndex(t => t.path === path)
    if (idx === -1) return null

    const tab = this._tabs[idx]
    tab.element.remove()
    this._tabs.splice(idx, 1)

    // 选择下一个 Tab
    let nextPath = null
    if (this._tabs.length > 0) {
      // 优先右边，没有则左边
      const nextIdx = Math.min(idx, this._tabs.length - 1)
      nextPath = this._tabs[nextIdx].path
    }

    if (this._tabs.length === 0) {
      this._renderEmpty()
      this._activePath = null
    }

    return nextPath
  }

  // ── 激活 Tab ──
  activateTab(path) {
    this._activePath = path
    for (const tab of this._tabs) {
      if (tab.path === path) {
        tab.element.classList.add('active')
        // 滚动到可见
        tab.element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      } else {
        tab.element.classList.remove('active')
      }
    }
  }

  // ── 设置脏标记 ──
  setDirty(path, dirty) {
    const tab = this._tabs.find(t => t.path === path)
    if (!tab) return
    tab.dirty = dirty
    const dot = tab.element.querySelector('.tab-dirty')
    if (dot) {
      dot.style.display = dirty ? 'inline' : 'none'
    }
  }

  // ── 获取当前激活路径 ──
  getActivePath() {
    return this._activePath
  }

  // ── 获取 Tab 数量 ──
  getTabCount() {
    return this._tabs.length
  }

  // ── 检查 Tab 是否存在 ──
  hasTab(path) {
    return this._tabs.some(t => t.path === path)
  }

  // ── 内部方法 ──

  _createTabElement(tab) {
    const el = document.createElement('div')
    el.className = 'editor-tab'
    el.dataset.path = tab.path

    // 文件图标
    const icon = document.createElement('span')
    icon.className = 'tab-icon'
    icon.textContent = this._getIcon(tab.name)
    el.appendChild(icon)

    // 文件名
    const nameSpan = document.createElement('span')
    nameSpan.className = 'tab-name'
    nameSpan.textContent = tab.name
    el.appendChild(nameSpan)

    // 脏标记
    const dirty = document.createElement('span')
    dirty.className = 'tab-dirty'
    dirty.textContent = '●'
    dirty.style.display = tab.dirty ? 'inline' : 'none'
    el.appendChild(dirty)

    // 关闭按钮
    const closeBtn = document.createElement('button')
    closeBtn.className = 'tab-close'
    closeBtn.innerHTML = '×'
    closeBtn.title = '关闭'
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (window.LiveFront?.Editor) {
        LiveFront.Editor.closeFile(tab.path)
      }
    })
    el.appendChild(closeBtn)

    // 点击切换
    el.addEventListener('click', () => {
      if (window.LiveFront?.Editor && this._activePath !== tab.path) {
        // 保存当前文件的 viewState 等
        LiveFront.Editor.openFile(tab.path, null) // null content = 已有 model
      }
    })

    return el
  }

  _getIcon(name) {
    const ext = name.split('.').pop().toLowerCase()
    const icons = {
      html: '', htm: '', css: '', scss: '', less: '',
      js: '', mjs: '', cjs: '', ts: '', tsx: '',
      jsx: '', json: '', md: '', txt: '',
      svg: '', xml: '', png: '', jpg: '',
      yml: '', yaml: ''
    }
    return icons[ext] || ''
  }

  _clearEmpty() {
    const empty = this._container.querySelector('.editor-tab-empty')
    if (empty) empty.remove()
  }

  _renderEmpty() {
    this._container.innerHTML = ''
    // Tab 栏在没有文件时也不显示空提示，空提示在编辑器主体中显示
  }
}

// 暴露到全局
window.LiveFront.TabBar = new TabBar()