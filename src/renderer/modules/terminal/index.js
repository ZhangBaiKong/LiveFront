/* LiveFront 终端模块 — manifest 注册 */
(function () {
  LiveFront.modules.register({
    id: 'terminal',
    name: '终端',
    version: '1.0.0',
    description: '集成终端 — 在 LiveFront 中直接运行 npm/git 等命令',

    dependencies: [],
    optionalDependencies: [],

    ui: {},
    commands: [
      { id: 'terminal.create', label: '新建终端' },
      { id: 'terminal.clear', label: '清空终端' },
      { id: 'terminal.close', label: '关闭终端' }
    ],
    shortcuts: [
      { key: 'Ctrl+`', command: 'terminal.toggle' },
      { key: 'Ctrl+Shift+T', command: 'terminal.create' }
    ],
    menus: [
      {
        menuPath: '终端',
        items: [
          { label: '新建终端', command: 'terminal.create' },
          { label: '清空终端', command: 'terminal.clear' },
          { label: '关闭终端', command: 'terminal.close' }
        ]
      }
    ],
    contextMenus: [],

    events: {
      emits: [
        { name: 'terminal:created', payload: '{ termId }' },
        { name: 'terminal:closed', payload: '{ termId }' }
      ],
      listens: ['project:opened']
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx

      // 注册命令
      ctx.commands.register('terminal.toggle', () => {
        LiveFront.TerminalManager.togglePanel()
      })
      ctx.commands.register('terminal.create', () => {
        LiveFront.TerminalManager.createTerminal()
      })
      ctx.commands.register('terminal.clear', () => {
        LiveFront.TerminalManager.clearActiveTerminal()
      })
      ctx.commands.register('terminal.close', () => {
        LiveFront.TerminalManager.closeActiveTerminal()
      })

      // 监听项目打开
      ctx.eventBus.on('project:opened', (data) => {
        const p = data?.path || data
        LiveFront.TerminalManager.onProjectOpened(p)
      })

      // 注册面板 Tab
      this._initPanel()

      console.log('[Terminal] Module initialized')
    },

    _initPanel() {
      LiveFront.PanelManager.registerTab({
        id: 'terminal',
        label: '终端',
        icon: '>',
        render: (container) => {
          LiveFront.TerminalManager.render(container)
        },
        onActivate: () => {
          LiveFront.TerminalManager.onActivate()
        },
        onDeactivate: () => {
          LiveFront.TerminalManager.onDeactivate()
        }
      })
    },

    destroy() {
      LiveFront.TerminalManager.destroyAll()
    }
  })
})()