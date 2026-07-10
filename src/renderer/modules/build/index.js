/* LiveFront Build 模块 — manifest 注册 */
(function () {
  LiveFront.modules.register({
    id: 'build',
    name: 'Build',
    version: '1.0.0',
    description: '项目构建引导 — 检测构建工具、启动开发/生产构建、导出 ZIP、部署占位',

    dependencies: [],
    optionalDependencies: ['terminal'],

    ui: {},
    commands: [
      { id: 'build.project', label: '构建项目' },
      { id: 'build.dev', label: '启动开发服务器' },
      { id: 'build.exportZip', label: '导出为 ZIP' },
      { id: 'build.deployVercel', label: '部署 Vercel' },
      { id: 'build.deployNetlify', label: '部署 Netlify' }
    ],
    shortcuts: [],
    menus: [
      {
        menuPath: '文件',
        items: [
          { separator: true },
          { label: '导出为 ZIP', command: 'build.exportZip' },
          { separator: true },
          { label: '部署到 Vercel（占位）', command: 'build.deployVercel' },
          { label: '部署到 Netlify（占位）', command: 'build.deployNetlify' }
        ]
      },
      {
        menuPath: '工具',
        items: [
          { separator: true },
          { label: '构建项目', command: 'build.project' },
          { label: '启动开发服务器', command: 'build.dev' }
        ]
      }
    ],
    contextMenus: [],

    events: {
      emits: [],
      listens: ['project:opened']
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx;

      ctx.commands.register('build.project', () => LiveFront.BuildManager.runBuild());
      ctx.commands.register('build.dev', () => LiveFront.BuildManager.runDev());
      ctx.commands.register('build.exportZip', () => LiveFront.BuildManager.exportZip());
      ctx.commands.register('build.deployVercel', () => LiveFront.BuildManager.deployVercel());
      ctx.commands.register('build.deployNetlify', () => LiveFront.BuildManager.deployNetlify());

      console.log('[Build] Module initialized');
    },

    destroy() {}
  });
})();