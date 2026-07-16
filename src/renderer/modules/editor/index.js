/* LiveFront Editor 模块 — Monaco Editor 集成 */
(function () {
  LiveFront.modules.register({
    id: 'editor',
    name: '编辑器',
    version: '0.1.0',
    description: 'Monaco Editor 代码编辑器',

    dependencies: [],
    optionalDependencies: [],

    ui: {
      statusbar: [
        { id: 'editor-lang', position: 'left', text: '', tooltip: '语言' },
        { id: 'editor-encoding', position: 'left', text: 'UTF-8', tooltip: '编码' },
        { id: 'editor-cursor', position: 'right', text: '', tooltip: '行/列' },
        { id: 'editor-indent', position: 'right', text: '空格: 2', tooltip: '缩进' }
      ]
    },

    commands: [
      { id: 'editor.save', label: '保存', category: '编辑器' },
      { id: 'editor.saveAs', label: '另存为', category: '编辑器' },
      { id: 'editor.newFile', label: '新建文件', category: '编辑器' },
      { id: 'editor.closeTab', label: '关闭当前标签', category: '编辑器' },
      { id: 'editor.toggleMinimap', label: '切换 Minimap', category: '编辑器' },
      { id: 'editor.toggleWordWrap', label: '切换自动换行', category: '编辑器' },
      { id: 'editor.zoomIn', label: '编辑器放大', category: '编辑器' },
      { id: 'editor.zoomOut', label: '编辑器缩小', category: '编辑器' },
      { id: 'editor.resetZoom', label: '重置编辑器缩放', category: '编辑器' },
      { id: 'editor.format', label: '格式化代码', category: '编辑器' }
    ],

    shortcuts: [
      { key: 'Ctrl+S', command: 'editor.save' },
      { key: 'Ctrl+Shift+S', command: 'editor.saveAs' },
      { key: 'Ctrl+N', command: 'editor.newFile' },
      { key: 'Ctrl+W', command: 'editor.closeTab' },
      { key: 'Ctrl+=', command: 'editor.zoomIn' },
      { key: 'Ctrl+-', command: 'editor.zoomOut' },
      { key: 'Ctrl+0', command: 'editor.resetZoom' },
      { key: 'Ctrl+Shift+W', command: 'editor.closeFileAndPreview' }
    ],

    menus: [
      {
        menuPath: '文件',
        items: [
          { label: '新建文件', command: 'editor.newFile', shortcut: 'Ctrl+N' },
          { separator: true },
          { label: '保存', command: 'editor.save', shortcut: 'Ctrl+S' },
          { label: '另存为...', command: 'editor.saveAs', shortcut: 'Ctrl+Shift+S' },
          { separator: true },
          { label: '关闭标签', command: 'editor.closeTab', shortcut: 'Ctrl+W' }
        ]
      },
      {
        menuPath: '编辑',
        items: [
          { label: '格式化代码', command: 'editor.format' },
          { separator: true },
          { label: '切换 Minimap', command: 'editor.toggleMinimap' },
          { label: '切换自动换行', command: 'editor.toggleWordWrap' }
        ]
      }
    ],

    contextMenus: [
      {
        target: 'editor',
        items: [
          { label: '剪切', command: null },
          { label: '复制', command: null },
          { label: '粘贴', command: null },
          { separator: true },
          { label: '查找所选内容', command: null },
          { label: '替换', command: null },
          { separator: true },
          { label: 'AI: 解释选中代码', command: null },
          { label: 'AI: 重构选中代码', command: null },
          { label: 'AI: 优化选中代码', command: null },
          { separator: true },
          { label: '复制文件路径', command: null },
          { label: '在文件管理器中显示', command: null }
        ]
      }
    ],

    events: {
      emits: [
        { name: 'editor:content-change', payload: '{ path, content }' },
        { name: 'editor:cursor-move', payload: '{ line, column, path }' },
        { name: 'editor:file-switched', payload: '{ path, name, language }' },
        { name: 'editor:file-closed', payload: '{ path }' },
        { name: 'file:saved', payload: '{ path }' }
      ],
      listens: [
        'file:opened',
        'project:open',
        'project:opened'
      ]
    },

    state: {
      openFiles: [],
      activeFile: null,
      dirty: new Set()
    },

    async init(ctx) {
      this._ctx = ctx
      this._editor = LiveFront.Editor
      this._tabBar = LiveFront.TabBar
      this._initialized = false

      // 注册命令
      ctx.commands.register('editor.save', () => this._save())
      ctx.commands.register('editor.saveAs', () => this._editor.saveAs())
      ctx.commands.register('editor.newFile', () => this._newFile())
      ctx.commands.register('editor.closeTab', () => this._closeCurrentTab())
      ctx.commands.register('editor.closeFileAndPreview', () => this._closeFileAndPreview())
      ctx.commands.register('editor.toggleMinimap', () => this._editor.toggleMinimap())
      ctx.commands.register('editor.toggleWordWrap', () => this._editor.toggleWordWrap())
      ctx.commands.register('editor.zoomIn', () => this._editor.setFontSize(this._editor._fontSize + 1))
      ctx.commands.register('editor.zoomOut', () => this._editor.setFontSize(this._editor._fontSize - 1))
      ctx.commands.register('editor.resetZoom', () => this._editor.setFontSize(14))
      ctx.commands.register('editor.format', () => {
        const editor = this._editor.getActiveEditor()
        if (editor) editor.getAction('editor.action.formatDocument')?.run()
      })

      // 监听文件打开事件
      ctx.eventBus.on('file:opened', (data) => this._handleFileOpen(data))

      // 监听编辑器事件
      ctx.eventBus.on('editor:content-change', (data) => {
        this._tabBar.setDirty(data.path, true)
        this.state.dirty.add(data.path)
      })

      ctx.eventBus.on('editor:cursor-move', (data) => {
        const cursorEl = document.getElementById('editor-cursor')
        if (cursorEl) cursorEl.textContent = `行 ${data.line}, 列 ${data.column}`
      })

      ctx.eventBus.on('editor:file-switched', (data) => {
        // 更新状态栏
        const langEl = document.getElementById('editor-lang')
        if (langEl) langEl.textContent = data.languageDisplay || ''
        const cursorEl = document.getElementById('editor-cursor')
        if (cursorEl) cursorEl.textContent = ''
        this._tabBar.activateTab(data.path)
        this.state.activeFile = data.path
      })

      ctx.eventBus.on('editor:file-closed', (data) => {
        this.state.dirty.delete(data.path)
      })

      ctx.eventBus.on('file:saved', (data) => {
        this._tabBar.setDirty(data.path, false)
        this.state.dirty.delete(data.path)
        // 输出面板记录
        if (LiveFront._outputLog) {
          const time = new Date().toLocaleTimeString()
          LiveFront._outputLog.textContent += '[' + time + '] [Editor] Saved: ' + data.path.split(/[/\\]/).pop() + '\n'
          LiveFront._outputLog.scrollTop = LiveFront._outputLog.scrollHeight
        }
      })

      // 初始化编辑器 UI
      this._initUI()

      // 监听核心命令（替换 app.js 中的临时处理）
      ctx.eventBus.on('command:save', () => this._save())
      ctx.eventBus.on('command:save-as', () => this._editor.saveAs())
      ctx.eventBus.on('command:new-file', () => this._newFile())
      ctx.eventBus.on('command:close-tab', () => this._closeCurrentTab())

      // 监听 file:changed 事件（外部文件变更）
      ctx.eventBus.on('file:changed', (data) => {
        const entry = this._editor.getEntry(data.path)
        if (!entry) return // 文件未在编辑器中打开
        // 如果编辑器中有未保存修改，提示用户
        if (entry.dirty) {
          // TODO: 显示冲突提示对话框
          console.warn('[Editor] File changed externally but has unsaved changes:', data.name)
        } else {
          // 自动重新加载
          ctx.services.fileSystem.readFile(data.path).then(content => {
            entry.model.setValue(content)
            entry.dirty = false
            this._tabBar.setDirty(data.path, false)
            console.log('[Editor] File reloaded from disk:', data.name)
          })
        }
      })

      this._initialized = true
      console.log('[Editor] Module initialized')
    },

    // ── 初始化编辑器 UI ──
    _initUI() {
      const mainArea = document.getElementById('workspaceMain')
      if (!mainArea) return

      // 标记由编辑器接管
      mainArea.dataset.managed = 'editor'
      mainArea.innerHTML = ''
      mainArea.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;'

      // Tab 栏
      const tabBarEl = document.createElement('div')
      mainArea.appendChild(tabBarEl)
      this._tabBar.init(tabBarEl)

      // 编辑器容器
      const editorContainer = document.createElement('div')
      editorContainer.className = 'editor-container'
      mainArea.appendChild(editorContainer)

      // Monaco 编辑器容器
      const monacoEl = document.createElement('div')
      monacoEl.className = 'editor-monaco'
      monacoEl.id = 'monacoContainer'
      editorContainer.appendChild(monacoEl)

      // 空状态
      const emptyState = document.createElement('div')
      emptyState.className = 'editor-empty'
      emptyState.id = 'editorEmpty'
      emptyState.innerHTML = `
        <div class="editor-empty-title">打开文件或创建新文件开始编辑</div>
        <div class="editor-empty-shortcuts">
          <span><kbd>Ctrl+O</kbd> 打开文件</span>
          <span><kbd>Ctrl+N</kbd> 新建文件</span>
          <span><kbd>Ctrl+P</kbd> 搜索文件</span>
        </div>
      `
      editorContainer.appendChild(emptyState)

      // 初始化 Monaco
      this._editor.init(monacoEl)

      // 初始隐藏 Monaco 容器，显示空状态
      monacoEl.style.display = 'none'
    },

    // ── 处理文件打开 ──
    async _handleFileOpen(data) {
      const { path, name } = data

      // 如果已在 Tab 中，直接切换
      if (this._editor.getEntry(path)) {
        this._editor.openFile(path, null) // 切换到已有 model
        this._tabBar.activateTab(path)
        return
      }

      // 读取文件内容
      try {
        // 大文件保护：检查大小
        const stat = await this._ctx.services.fileSystem.stat(path)
        if (stat.size > 5 * 1024 * 1024) {
          const confirm = await this._ctx.services.dialog.confirm(
            `文件 ${name} 大小为 ${(stat.size / 1024 / 1024).toFixed(1)}MB，是否以只读模式打开？`
          )
          if (!confirm) return
          // TODO: 只读模式
        }

        const content = await this._ctx.services.fileSystem.readFile(path)

        // 隐藏空状态，显示 Monaco
        const emptyState = document.getElementById('editorEmpty')
        const monacoEl = document.getElementById('monacoContainer')
        if (emptyState) emptyState.style.display = 'none'
        if (monacoEl) monacoEl.style.display = 'block'

        // 打开到编辑器
        const entry = await this._editor.openFile(path, content)

        // 添加 Tab
        this._tabBar.addTab(path, name, false)
        this.state.activeFile = path

        // 显示工作区
        this._ctx.layout.showWorkspace()
      } catch (e) {
        console.error('[Editor] Failed to open file:', e)
      }
    },

    // ── 保存 ──
    async _save() {
      if (!this._editor.getActivePath()) return
      await this._editor.saveFile()
    },

    // ── 新建文件 ──
    async _newFile() {
      const entry = await this._editor.newFile()
      if (entry) {
        // 隐藏空状态
        const emptyState = document.getElementById('editorEmpty')
        const monacoEl = document.getElementById('monacoContainer')
        if (emptyState) emptyState.style.display = 'none'
        if (monacoEl) monacoEl.style.display = 'block'

        this._tabBar.addTab(entry.path, entry.name, false)
        this.state.activeFile = entry.path
      }
    },

    // ── 关闭当前 Tab ──
    async _closeCurrentTab() {
      const activePath = this._editor.getActivePath()
      if (!activePath) return

      // 检查是否有未保存修改
      if (this._editor.isDirty(activePath)) {
        const entry = this._editor.getEntry(activePath)
        const name = entry ? entry.name : activePath.split(/[/\\]/).pop()
        const result = await this._confirmSave(name)
        if (result === 'cancel') return
        if (result === 'save') {
          await this._editor.saveFile(activePath)
        }
        // result === 'dont-save' → 继续关闭
      }

      // 移除 Tab 并获取下一个激活路径
      const nextPath = this._tabBar.removeTab(activePath)
      this._editor.closeFile(activePath)

      // 切换到下一个 Tab
      if (nextPath) {
        this._editor.openFile(nextPath, null)
        this._tabBar.activateTab(nextPath)
      } else {
        // 没有打开的文件了，显示空状态
        const emptyState = document.getElementById('editorEmpty')
        const monacoEl = document.getElementById('monacoContainer')
        if (emptyState) emptyState.style.display = ''
        if (monacoEl) monacoEl.style.display = 'none'
        this.state.activeFile = null
        // 更新状态栏
        const langEl = document.getElementById('editor-lang')
        if (langEl) langEl.textContent = ''
        const cursorEl = document.getElementById('editor-cursor')
        if (cursorEl) cursorEl.textContent = ''
      }
    },

    // ??? ??????? ???
    async _closeFileAndPreview() {
      const activePath = this._editor.getActivePath()
      if (activePath) {
        if (this._editor.isDirty(activePath)) {
          const entry = this._editor.getEntry(activePath)
          const name = entry ? entry.name : activePath.split(/[\/\\]/).pop()
          const result = await this._confirmSave(name)
          if (result === 'cancel') return
          if (result === 'save') {
            await this._editor.saveFile(activePath)
          }
        }
        const nextPath = this._tabBar.removeTab(activePath)
        this._editor.closeFile(activePath)
        if (nextPath) {
          this._editor.openFile(nextPath, null)
          this._tabBar.activateTab(nextPath)
        } else {
          const emptyState = document.getElementById('editorEmpty')
          const monacoEl = document.getElementById('monacoContainer')
          if (emptyState) emptyState.style.display = ''
          if (monacoEl) monacoEl.style.display = 'none'
          this.state.activeFile = null
          const langEl = document.getElementById('editor-lang')
          if (langEl) langEl.textContent = ''
          const cursorEl = document.getElementById('editor-cursor')
          if (cursorEl) cursorEl.textContent = ''
        }
      }
      if (LiveFront.Preview) {
        await LiveFront.Preview.clearPreview()
      }
      LiveFront.state.selectedElement = null
      LiveFront.state.hoverElement = null
      LiveFront.EventBus.emit('element:deselected')
    },

    // ── 保存确认对话框（简单实现） ──
    _confirmSave(filename) {
      return new Promise((resolve) => {
        // 创建模态对话框
        const overlay = document.createElement('div')
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999;'

        const dialog = document.createElement('div')
        dialog.style.cssText = 'background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;max-width:400px;width:100%;box-shadow:var(--shadow-lg);'

        dialog.innerHTML = `
          <div style="font-size:15px;font-weight:600;margin-bottom:12px;">保存更改？</div>
          <div style="color:var(--text-secondary);font-size:13px;margin-bottom:24px;">${filename} 有未保存的更改。是否保存？</div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn-ghost" data-action="cancel">取消</button>
            <button class="btn btn-ghost" data-action="dont-save">不保存</button>
            <button class="btn btn-primary" data-action="save">保存</button>
          </div>
        `

        dialog.addEventListener('click', (e) => {
          const action = e.target.dataset.action
          if (action) {
            overlay.remove()
            resolve(action)
          }
        })

        overlay.appendChild(dialog)
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.remove()
            resolve('cancel')
          }
        })
        document.body.appendChild(overlay)
      })
    },

    destroy() {
      this._editor.dispose()
    }
  })
})()
