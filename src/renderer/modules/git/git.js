/* LiveFront Git 模块 — 核心逻辑 */
(function () {
  const { DOM, EventBus, Commands, PanelManager, Services, Layout, Storage } = LiveFront

  // ============ 状态 ============
  const state = {
    projectPath: null,
    isRepo: false,
    currentBranch: '',
    files: [],
    ahead: 0,
    behind: 0,
    commits: [],
    stagedCollapsed: false,
    changesCollapsed: false,
    branchDropdownOpen: false,
    branchList: [],
    commitMsg: '',
    initialized: false
  }

  let _refreshTimer = null
  let _ctx = null
  let _panelEl = null
  let _branchDropdownEl = null
  let _contextMenuEl = null
  let _diffEditor = null
  let _diffOverlayEl = null
  let _diffModels = []

  // ============ API ============
  function gitApi() { return window.api?.git }

  // ============ GitManager ============
  const GitManager = {
    init(ctx) {
      _ctx = ctx
      _registerCommands()
      _registerPanel()
      _subscribeEvents()

      const last = Storage.get('lastProjectPath')
      if (last) {
        const exists = Services.fileSystem.exists(last)
        if (exists && typeof exists.then === 'function') {
          exists.then(ok => { if (ok) _loadProject(last) })
        } else if (exists) {
          _loadProject(last)
        }
      }
    },

    destroy() {
      _closeDiff()
      _closeBranchDropdown()
      _closeContextMenu()
      if (_refreshTimer) clearTimeout(_refreshTimer)
    }
  }

  LiveFront.GitManager = GitManager

  // ============ 命令注册 ============
  function _registerCommands() {
    Commands.register('git.toggle', () => {
      const active = PanelManager.getActiveTab()
      if (active && active.id === 'git') {
        Layout.togglePanel()
      } else {
        PanelManager.activateTab('git')
        const panel = document.getElementById('panel')
        if (panel && panel.classList.contains('hidden')) Layout.togglePanel()
      }
    })

    Commands.register('git.refresh', () => {
      if (state.projectPath && state.isRepo) _refreshAll()
    })

    Commands.register('git.commit', () => {
      _doCommit()
    })

    Commands.register('git.initRepo', async () => {
      if (!state.projectPath) { _showToast('请先打开一个项目'); return }
      try {
        await Services.fileSystem.createDir(state.projectPath + '/.git')
        // git init handled via IPC
        // Use IPC instead
        const result = await gitApi()?.init({ projectPath: state.projectPath })
        if (result?.isGitRepo) {
          state.isRepo = true
          _showToast('Git 仓库已初始化')
          _refreshAll()
        }
      } catch (e) {
        // Fallback: try direct git init through a temp file approach
        _showToast('初始化失败，请在终端运行 git init')
      }
    })
  }

  // ============ 面板注册 ============
  function _registerPanel() {
    PanelManager.registerTab({
      id: 'git',
      label: '源代码管理',
      icon: '',
      badge: null,
      render(container) {
        _panelEl = container
        _render()
      },
      onActivate() {},
      onDeactivate() {
        _closeBranchDropdown()
        _closeContextMenu()
      }
    })
  }

  // ============ 事件订阅 ============
  function _subscribeEvents() {
    EventBus.on('project:opened', (data) => {
      const p = data?.path || data
      if (typeof p === 'string') _loadProject(p)
    })

    const refreshEvents = ['file:changed', 'file:added', 'file:removed']
    refreshEvents.forEach(evt => {
      EventBus.on(evt, () => {
        if (state.projectPath && state.isRepo) _refreshDebounce()
      })
    })
  }

  // ============ 项目加载 ============
  async function _loadProject(projectPath) {
    state.projectPath = projectPath
    state.isRepo = false
    state.files = []
    state.commits = []
    state.currentBranch = ''
    state.ahead = 0
    state.behind = 0
    state.commitMsg = ''
    state.branchList = []

    const api = gitApi()
    if (!api) { _render(); return }

    try {
      const result = await api.init({ projectPath })
      if (result?.isGitRepo) {
        state.isRepo = true
        state.currentBranch = result.currentBranch || ''
        await _refreshAll()
      } else {
        state.isRepo = false
        _render()
      }
    } catch {
      state.isRepo = false
      _render()
    }
  }

  // ============ 刷新 ============
  function _refreshDebounce() {
    if (_refreshTimer) clearTimeout(_refreshTimer)
    _refreshTimer = setTimeout(() => { _refreshAll() }, 500)
  }

  async function _refreshAll() {
    const api = gitApi()
    if (!api || !state.projectPath || !state.isRepo) return
    try {
      const [statusResult, logResult, branchResult] = await Promise.all([
        api.status({ projectPath: state.projectPath }),
        api.log({ projectPath: state.projectPath, count: 20 }),
        api.branches({ projectPath: state.projectPath })
      ])

      if (statusResult) {
        state.currentBranch = statusResult.currentBranch || state.currentBranch
        state.files = statusResult.files || []
        state.ahead = statusResult.ahead || 0
        state.behind = statusResult.behind || 0
      }
      if (logResult) state.commits = logResult.commits || []
      if (branchResult) {
        state.branchList = branchResult.branches || []
        state.currentBranch = branchResult.current || state.currentBranch
      }

      _updateBadge()
      _render()
    } catch (e) {
      console.error('[Git] Refresh failed:', e)
    }
  }

  function _updateBadge() {
    const unstaged = state.files.filter(f => f.workingDir && f.workingDir !== ' ' && f.workingDir !== '?').length
    const untracked = state.files.filter(f => f.index === '?' || f.workingDir === '?').length
    const count = unstaged + untracked
    PanelManager.updateBadge('git', count > 0 ? count : null)
  }

  // ============ 文件分类 ============
  function _getStaged() { return state.files.filter(f => f.index && f.index !== ' ' && f.index !== '?') }
  function _getChanges() { return state.files.filter(f => (f.workingDir && f.workingDir !== ' ') || f.index === '?') }

  // ============ 渲染 ============
  function _render() {
    if (!_panelEl) return
    _panelEl.innerHTML = ''

    const panel = DOM.el('div', { class: 'git-panel' })

    if (!state.projectPath) {
      panel.appendChild(_renderEmpty('', '尚未打开项目\n请先打开一个文件夹'))
      _panelEl.appendChild(panel)
      return
    }

    if (!state.isRepo) {
      panel.appendChild(_renderEmpty('', '此项目未初始化 Git\n请在终端运行 git init 初始化'))
      _panelEl.appendChild(panel)
      return
    }

    // 面板头部
    panel.appendChild(_renderHeader())
    // 分支信息
    panel.appendChild(_renderBranchInfo())
    // 暂存区
    panel.appendChild(_renderStagedSection())
    // 变更
    panel.appendChild(_renderChangesSection())
    // 提交
    panel.appendChild(_renderCommitSection())
    // 最近提交
    panel.appendChild(_renderLogSection())

    _panelEl.appendChild(panel)
  }

  function _renderEmpty(icon, text) {
    const el = DOM.el('div', { class: 'git-empty' })
    el.appendChild(DOM.el('div', { class: 'git-empty-icon' }, icon))
    const lines = text.split('\n')
    lines.forEach(l => el.appendChild(DOM.el('div', { class: 'git-empty-text' }, l)))
    return el
  }

  function _renderHeader() {
    const header = DOM.el('div', { class: 'git-header' })
    const left = DOM.el('div', { class: 'git-header-left' })
    left.appendChild(DOM.el('span', {}, '源代码管理'))
    header.appendChild(left)

    const right = DOM.el('div', { class: 'git-header-right' })
    const refreshBtn = DOM.el('div', { class: 'git-header-btn', title: '刷新' }, '↻')
    refreshBtn.addEventListener('click', () => { if (state.isRepo) _refreshAll() })
    right.appendChild(refreshBtn)
    header.appendChild(right)

    return header
  }

  function _renderBranchInfo() {
    const el = DOM.el('div', { class: 'git-branch-info' })
    el.appendChild(DOM.el('span', { class: 'git-branch-icon' }, ''))
    el.appendChild(DOM.el('span', { class: 'git-branch-name' }, state.currentBranch || 'HEAD'))
    if (state.ahead > 0 || state.behind > 0) {
      const track = []
      if (state.ahead > 0) track.push('↑' + state.ahead)
      if (state.behind > 0) track.push('↓' + state.behind)
      el.appendChild(DOM.el('span', { class: 'git-branch-track' }, track.join(' ')))
    }
    el.addEventListener('click', (e) => _toggleBranchDropdown(e))
    return el
  }

  function _renderStagedSection() {
    const staged = _getStaged()
    const section = DOM.el('div')
    const header = DOM.el('div', { class: 'git-section-header' })

    const left = DOM.el('span', {}, '暂存 (' + staged.length + ')')
    left.addEventListener('click', () => { state.stagedCollapsed = !state.stagedCollapsed; _render() })
    header.appendChild(left)

    const actions = DOM.el('div', { class: 'git-section-actions' })
    if (staged.length > 0) {
      const unstageAllBtn = DOM.el('div', { class: 'git-section-btn', title: '取消所有暂存' }, '−')
      unstageAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const api = gitApi()
        if (api) {
          await api.unstage({ projectPath: state.projectPath, files: staged.map(f => f.path) })
          _refreshAll()
        }
      })
      actions.appendChild(unstageAllBtn)
    }
    header.appendChild(actions)
    section.appendChild(header)

    if (!state.stagedCollapsed) {
      staged.forEach(f => {
        const row = _renderFileRow(f, true)
        section.appendChild(row)
      })
    }

    return section
  }

  function _renderChangesSection() {
    const changes = _getChanges()
    const section = DOM.el('div')
    const header = DOM.el('div', { class: 'git-section-header' })

    const left = DOM.el('span', {}, '变更 (' + changes.length + ')')
    left.addEventListener('click', () => { state.changesCollapsed = !state.changesCollapsed; _render() })
    header.appendChild(left)

    const actions = DOM.el('div', { class: 'git-section-actions' })
    if (changes.length > 0) {
      const stageAllBtn = DOM.el('div', { class: 'git-section-btn', title: '暂存所有更改' }, '+')
      stageAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const api = gitApi()
        if (api) {
          await api.stage({ projectPath: state.projectPath, files: changes.map(f => f.path) })
          _refreshAll()
        }
      })
      actions.appendChild(stageAllBtn)
    }
    header.appendChild(actions)
    section.appendChild(header)

    if (!state.changesCollapsed) {
      changes.forEach(f => {
        const row = _renderFileRow(f, false)
        section.appendChild(row)
      })
    }

    return section
  }

  function _renderFileRow(file, isStaged) {
    const row = DOM.el('div', { class: 'git-file-row' })
    const statusChar = isStaged ? file.index : (file.workingDir || file.index)
    const statusClass = 'git-status-' + (statusChar || 'U').charAt(0).toUpperCase()

    const statusEl = DOM.el('span', { class: 'git-file-status ' + statusClass }, _statusIcon(statusChar))
    const nameEl = DOM.el('span', { class: 'git-file-name' }, file.path)

    row.appendChild(statusEl)
    row.appendChild(nameEl)

    // 操作按钮
    const actionBtn = DOM.el('div', { class: 'git-file-action' })
    if (isStaged) {
      actionBtn.textContent = '−'
      actionBtn.title = '取消暂存'
      actionBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const api = gitApi()
        if (api) {
          await api.unstage({ projectPath: state.projectPath, files: [file.path] })
          _refreshAll()
        }
      })
    } else {
      actionBtn.textContent = '+'
      actionBtn.title = '暂存更改'
      actionBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const api = gitApi()
        if (api) {
          await api.stage({ projectPath: state.projectPath, files: [file.path] })
          _refreshAll()
        }
      })
    }
    row.appendChild(actionBtn)

    // 点击 → 查看 Diff
    row.addEventListener('click', () => _showDiff(file))

    // 右键菜单
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      _showContextMenu(e, file, isStaged)
    })

    return row
  }

  function _renderCommitSection() {
    const staged = _getStaged()
    const section = DOM.el('div', { class: 'git-commit-section' })

    const textarea = DOM.el('textarea', { class: 'git-commit-input', placeholder: '提交信息...' })
    textarea.value = state.commitMsg
    textarea.addEventListener('input', () => { state.commitMsg = textarea.value })
    section.appendChild(textarea)

    const btn = DOM.el('button', { class: 'git-commit-btn' })
    if (staged.length > 0) {
      btn.innerHTML = '<span>提交</span> <span class="git-commit-badge">' + staged.length + '</span>'
    } else {
      btn.innerHTML = '<span>提交</span>'
    }
    btn.disabled = !state.commitMsg.trim() || staged.length === 0
    btn.addEventListener('click', () => _doCommit())
    section.appendChild(btn)

    return section
  }

  function _renderLogSection() {
    const section = DOM.el('div', { class: 'git-log-section' })
    const header = DOM.el('div', { class: 'git-section-header' })
    header.appendChild(DOM.el('span', {}, '最近提交'))
    section.appendChild(header)

    state.commits.forEach(c => {
      const row = DOM.el('div', { class: 'git-log-row' })
      const hash = DOM.el('span', { class: 'git-log-hash' }, c.hash?.substring(0, 7) || '')
      const msg = DOM.el('span', { class: 'git-log-msg' }, c.message || '')
      row.appendChild(hash)
      row.appendChild(msg)
      section.appendChild(row)
    })

    return section
  }

  // ============ 状态图标 ============
  function _statusIcon(s) {
    const c = (s || '').charAt(0).toUpperCase()
    const map = { 'M': 'M', 'A': 'A', 'D': 'D', 'R': 'R', '?': '?', 'C': 'C' }
    return map[c] || s || '?'
  }

  // ============ 提交 ============
  async function _doCommit() {
    const msg = state.commitMsg.trim()
    if (!msg) { _showToast('请输入提交信息'); return }
    const staged = _getStaged()
    if (staged.length === 0) { _showToast('没有暂存的更改'); return }

    const api = gitApi()
    if (!api) return

    try {
      const result = await api.commit({ projectPath: state.projectPath, message: msg })
      if (result?.success) {
        state.commitMsg = ''
        _showToast('提交成功 ' + (result.hash || '').substring(0, 7))
        await _refreshAll()
      }
    } catch (e) {
      _showToast('提交失败: ' + e.message)
    }
  }

  // ============ 分支切换 ============
  function _toggleBranchDropdown(e) {
    if (state.branchDropdownOpen) {
      _closeBranchDropdown()
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    _branchDropdownEl = DOM.el('div', { class: 'git-branch-dropdown' })
    _branchDropdownEl.style.left = rect.left + 'px'
    _branchDropdownEl.style.top = rect.bottom + 'px'

    // 当前分支
    state.branchList.forEach(b => {
      const item = DOM.el('div', { class: 'git-branch-item' + (b === state.currentBranch ? ' current' : '') })
      item.appendChild(DOM.el('span', {}, (b === state.currentBranch ? '> ' : '  ') + b))
      if (b !== state.currentBranch) {
        item.addEventListener('click', () => _checkoutBranch(b))
      }
      _branchDropdownEl.appendChild(item)
    })

    // 分隔线
    _branchDropdownEl.appendChild(DOM.el('div', { class: 'git-branch-separator' }))

    // 新建分支
    const createRow = DOM.el('div', { class: 'git-branch-create' })
    const input = DOM.el('input', { placeholder: '新分支名称...' })
    const createBtn = DOM.el('button', {}, '创建')
    createBtn.addEventListener('click', () => _createBranch(input.value.trim()))
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') _createBranch(input.value.trim()) })
    createRow.appendChild(input)
    createRow.appendChild(createBtn)
    _branchDropdownEl.appendChild(createRow)

    document.body.appendChild(_branchDropdownEl)
    state.branchDropdownOpen = true
    input.focus()

    setTimeout(() => {
      document.addEventListener('mousedown', _onBranchDropdownOutside)
    }, 0)
  }

  function _onBranchDropdownOutside(e) {
    if (_branchDropdownEl && !_branchDropdownEl.contains(e.target)) {
      _closeBranchDropdown()
    }
  }

  function _closeBranchDropdown() {
    if (_branchDropdownEl) { _branchDropdownEl.remove(); _branchDropdownEl = null }
    state.branchDropdownOpen = false
    document.removeEventListener('mousedown', _onBranchDropdownOutside)
  }

  async function _checkoutBranch(branch) {
    _closeBranchDropdown()
    const api = gitApi()
    if (!api) return
    try {
      await api.checkout({ projectPath: state.projectPath, branch })
      _showToast('已切换到分支: ' + branch)
      await _refreshAll()
    } catch (e) {
      _showToast('切换失败: ' + e.message)
    }
  }

  async function _createBranch(name) {
    if (!name) return
    _closeBranchDropdown()
    const api = gitApi()
    if (!api) return
    try {
      await api.createBranch({ projectPath: state.projectPath, name })
      _showToast('已创建并切换到分支: ' + name)
      await _refreshAll()
    } catch (e) {
      _showToast('创建分支失败: ' + e.message)
    }
  }

  // ============ 右键菜单 ============
  function _showContextMenu(e, file, isStaged) {
    _closeContextMenu()
    _contextMenuEl = DOM.el('div', { class: 'git-context-menu' })
    _contextMenuEl.style.left = e.clientX + 'px'
    _contextMenuEl.style.top = e.clientY + 'px'

    const items = [
      { label: '打开文件', action: () => _openFileInEditor(file) },
      { label: '查看 Diff', action: () => _showDiff(file) },
      { separator: true },
    ]

    if (isStaged) {
      items.push({ label: '取消暂存', action: async () => {
        const api = gitApi()
        if (api) { await api.unstage({ projectPath: state.projectPath, files: [file.path] }); _refreshAll() }
      }})
    } else {
      items.push({ label: '暂存更改', action: async () => {
        const api = gitApi()
        if (api) { await api.stage({ projectPath: state.projectPath, files: [file.path] }); _refreshAll() }
      }})
    }

    items.push({ separator: true })
    items.push({ label: '丢弃更改', action: () => _discardFile(file) })

    items.forEach(item => {
      if (item.separator) {
        _contextMenuEl.appendChild(DOM.el('div', { class: 'git-context-separator' }))
      } else {
        const el = DOM.el('div', { class: 'git-context-item' }, item.label)
        el.addEventListener('click', () => { _closeContextMenu(); item.action() })
        _contextMenuEl.appendChild(el)
      }
    })

    document.body.appendChild(_contextMenuEl)
    setTimeout(() => { document.addEventListener('mousedown', _onContextMenuOutside) }, 0)
  }

  function _onContextMenuOutside(e) {
    if (_contextMenuEl && !_contextMenuEl.contains(e.target)) _closeContextMenu()
  }

  function _closeContextMenu() {
    if (_contextMenuEl) { _contextMenuEl.remove(); _contextMenuEl = null }
    document.removeEventListener('mousedown', _onContextMenuOutside)
  }

  // ============ 打开文件 ============
  function _openFileInEditor(file) {
    if (!state.projectPath) return
    const fullPath = state.projectPath + '/' + file.path
    Commands.execute('editor.openFile', fullPath)
  }

  // ============ 丢弃更改 ============
  async function _discardFile(file) {
    const confirmed = await Services.dialog.confirm('确定要丢弃对 ' + file.path + ' 的更改吗？此操作不可撤销。')
    if (!confirmed) return
    const api = gitApi()
    if (!api) return
    try {
      await api.discard({ projectPath: state.projectPath, file: file.path })
      _showToast('已丢弃更改: ' + file.path)
      await _refreshAll()
    } catch (e) {
      _showToast('丢弃失败: ' + e.message)
    }
  }

  // ============ Diff 视图 ============
  async function _showDiff(file) {
    const mainArea = document.getElementById('workspaceMain')
    if (!mainArea) return

    // 确保工作区可见
    Layout.showWorkspace()

    // 关闭已有的 Diff
    _closeDiff()

    // 创建覆盖层
    _diffOverlayEl = DOM.el('div', { class: 'git-diff-overlay' })

    // 头部
    const header = DOM.el('div', { class: 'git-diff-header' })
    header.appendChild(DOM.el('span', { class: 'git-diff-title' }, '[Git] ' + file.path + '.diff'))
    const closeBtn = DOM.el('div', { class: 'git-diff-close' }, '×')
    closeBtn.addEventListener('click', () => _closeDiff())
    header.appendChild(closeBtn)
    _diffOverlayEl.appendChild(header)

    // 编辑器体
    const body = DOM.el('div', { class: 'git-diff-body' })
    _diffOverlayEl.appendChild(body)

    mainArea.style.position = 'relative'
    mainArea.appendChild(_diffOverlayEl)

    // 动态导入 Monaco
    try {
      const monaco = await import('monaco-editor/esm/vs/editor/editor.api')

      // 获取 Diff 数据
      const api = gitApi()
      if (!api) return

      const [originalDiff, modifiedContent] = await Promise.all([
        api.diff({ projectPath: state.projectPath, file: file.path, staged: false }),
        Services.fileSystem.readFile(state.projectPath + '/' + file.path).catch(() => '')
      ])

      // 获取原始内容（从 HEAD）
      let originalContent = ''
      try {
        const headDiff = await api.diff({ projectPath: state.projectPath, file: file.path, staged: true })
        // 如果暂存区有，用暂存区的diff做参考
      } catch {}

      // 尝试从 git show 获取原始内容
      try {
        const raw = await window.api.fs.readFile(state.projectPath + '/' + file.path).catch(() => null)
      } catch {}

      // 使用 DiffEditor
      const lang = _getLanguage(file.path)

      // 如果文件是新增的，原始内容为空
      const isNew = file.index === '?' || file.workingDir === '?'
      if (isNew) {
        originalContent = ''
      } else {
        // 尝试通过 git show 获取 HEAD 版本
        try {
          const result = await fetch('http://localhost').catch(() => null) // placeholder
        } catch {}
        // 用 diff 的方式回推原始内容 — 简单实现：显示 diff 文本
        originalContent = ''
      }

      // 简化方案：直接用原始文件和当前文件做对比
      // 对于非新增文件，尝试使用暂存区 diff 来构建原始视图
      // 为了简单和可靠，直接展示当前文件 vs diff 信息

      const uri1 = monaco.Uri.file('git://original/' + file.path)
      const uri2 = monaco.Uri.file('git://modified/' + file.path)

      const model1 = monaco.editor.createModel(originalContent, lang, uri1)
      const model2 = monaco.editor.createModel(modifiedContent || '', lang, uri2)
      _diffModels = [model1, model2]

      _diffEditor = monaco.editor.createDiffEditor(body, {
        theme: 'livefront-dark',
        readOnly: true,
        renderSideBySide: true,
        automaticLayout: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false
      })

      _diffEditor.setModel({ original: model1, modified: model2 })

    } catch (e) {
      console.error('[Git] Diff view error:', e)
      body.innerHTML = '<div style="padding:20px;color:var(--text-muted);">无法加载 Diff 视图: ' + e.message + '</div>'
    }
  }

  function _closeDiff() {
    if (_diffEditor) { _diffEditor.dispose(); _diffEditor = null }
    _diffModels.forEach(m => { try { m.dispose() } catch {} })
    _diffModels = []
    if (_diffOverlayEl) { _diffOverlayEl.remove(); _diffOverlayEl = null }
  }

  function _getLanguage(filePath) {
    const ext = filePath.split('.').pop().toLowerCase()
    const map = {
      html: 'html', htm: 'html', css: 'css', js: 'javascript', mjs: 'javascript',
      ts: 'typescript', json: 'json', md: 'markdown', py: 'python',
      rb: 'ruby', go: 'go', rs: 'rust', java: 'java', sh: 'shell'
    }
    return map[ext] || 'plaintext'
  }

  // ============ Toast ============
  function _showToast(msg) {
    let toast = document.querySelector('.git-toast')
    if (!toast) {
      toast = DOM.el('div', { class: 'git-toast' })
      document.body.appendChild(toast)
    }
    toast.textContent = msg
    toast.classList.add('visible')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 3000)
  }

  // ============ 防抖 ============
  function _debounce(fn, ms) {
    let t
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
  }
})()
