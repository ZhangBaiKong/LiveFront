/* LiveFront Git 模块 — manifest 注册 */
(function () {
  LiveFront.modules.register({
    id: 'git',
    name: '源代码管理',
    version: '1.0.0',
    description: 'Git 可视化操作 — 查看变更、提交代码、切换分支',

    dependencies: [],
    optionalDependencies: ['editor'],

    ui: {},
    commands: [
      { id: 'git.toggle', label: '切换源代码管理面板' },
      { id: 'git.refresh', label: '刷新 Git 状态' },
      { id: 'git.commit', label: '提交更改' },
      { id: 'git.initRepo', label: '初始化 Git 仓库' }
    ],
    shortcuts: [
      { key: 'Ctrl+Shift+G', command: 'git.toggle' }
    ],
    menus: [
      {
        menuPath: '视图',
        items: [
          { label: '切换源代码管理面板', command: 'git.toggle', shortcut: 'Ctrl+Shift+G' }
        ]
      },
      {
        menuPath: '工具',
        items: [
          { label: '初始化 Git 仓库', command: 'git.initRepo' },
          { label: '查看 Git 面板', command: 'git.toggle' }
        ]
      }
    ],
    contextMenus: [],

    events: {
      emits: [
        { name: 'git:status-changed', payload: '{}' }
      ],
      listens: ['project:opened', 'file:changed', 'file:added', 'file:removed']
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx
      LiveFront.GitManager.init(ctx)
      console.log('[Git] Module initialized')
    },

    destroy() {
      LiveFront.GitManager.destroy()
    }
  })
})()
