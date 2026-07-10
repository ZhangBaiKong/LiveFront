/* LiveFront Preview 模块 — 实时预览 */
(function () {
  LiveFront.modules.register({
    id: 'preview',
    name: '预览',
    version: '0.1.0',
    description: '实时预览 WebView',

    dependencies: [],
    optionalDependencies: ['editor'],

    ui: {},

    commands: [
      { id: 'preview.refresh', label: '刷新预览', category: '预览' },
      { id: 'preview.external', label: '独立窗口预览', category: '预览' },
      { id: 'preview.desktop', label: '桌面视图', category: '预览' },
      { id: 'preview.tablet', label: '平板视图', category: '预览' },
      { id: 'preview.mobile', label: '手机视图', category: '预览' }
    ],

    shortcuts: [
      { key: 'Ctrl+Shift+R', command: 'preview.refresh' }
    ],

    menus: [
      {
        menuPath: '视图',
        items: [
          { label: '刷新预览', command: 'preview.refresh', shortcut: 'Ctrl+Shift+R' },
          { separator: true },
          { label: '桌面视图', command: 'preview.desktop' },
          { label: '平板视图', command: 'preview.tablet' },
          { label: '手机视图', command: 'preview.mobile' }
        ]
      }
    ],

    contextMenus: [],

    events: {
      emits: [
        { name: 'preview:ready', payload: '{}' },
        { name: 'element:selected', payload: '{ tagName, selector, ... }' },
        { name: 'element:deselected', payload: '{}' }
      ],
      listens: ['project:opened', 'file:saved']
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx
      this._preview = LiveFront.Preview

      // 注册命令
      ctx.commands.register('preview.refresh', () => this._preview.refresh())
      ctx.commands.register('preview.external', () => {
        const url = 'http://127.0.0.1:' + this._preview.getPort() + '/'
        ctx.services.preview.openExternalWindow(url)
      })
      ctx.commands.register('preview.desktop', () => this._preview._setDevice('desktop',
        document.querySelector('[data-device="desktop"]')))
      ctx.commands.register('preview.tablet', () => this._preview._setDevice('tablet',
        document.querySelector('[data-device="tablet"]')))
      ctx.commands.register('preview.mobile', () => this._preview._setDevice('mobile',
        document.querySelector('[data-device="mobile"]')))

      // 初始化预览区 UI
      this._initUI()

      // 监听项目打开
      ctx.eventBus.on('project:opened', async (data) => {
        await this._preview.startPreview(data.path)
      })

      // 监听文件保存 → 防抖刷新
      ctx.eventBus.on('file:saved', (data) => {
        const ext = data.path.split('.').pop().toLowerCase()
        if (['jsx', 'tsx', 'ts'].includes(ext)) {
          this._debounceReactRefresh(data.path)
          return
        }
        if (['html', 'htm', 'css', 'js', 'mjs', 'json'].includes(ext)) {
          this._debounceRefresh()
        }
      })

      // 监听 chokidar 的外部文件变化
      ctx.eventBus.on('file:changed', (data) => {
        const ext = data.path.split('.').pop().toLowerCase()
        if (['jsx', 'tsx', 'ts'].includes(ext)) {
          this._debounceReactRefresh(data.path)
          return
        }
        if (['html', 'htm', 'css', 'js', 'mjs', 'json'].includes(ext)) {
          this._debounceRefresh()
        }
      })

      console.log('[Preview] Module initialized')
    },

    _initUI() {
      const previewArea = document.getElementById('workspacePreview')
      if (!previewArea) return
      previewArea.innerHTML = ''
      previewArea.style.cssText = 'display:flex;flex-direction:column;min-height:0;overflow:hidden;'
      this._preview.init(previewArea)
    },

    _debounceRefresh() {
      if (this._refreshTimer) clearTimeout(this._refreshTimer)
      this._refreshTimer = setTimeout(() => {
        this._preview.refresh()
        LiveFront.Services.preview.refreshExternal()
      }, 300)
    },

    _debounceReactRefresh(filePath) {
      if (this._reactRefreshTimer) clearTimeout(this._reactRefreshTimer)
      this._reactRefreshTimer = setTimeout(() => {
        this._preview.reactRefresh(filePath)
      }, 200)
    },

    destroy() {
      this._preview.stopPreview()
    }
  })
})()
