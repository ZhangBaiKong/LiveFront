/* LiveFront 素材库模块 */
(function () {
  LiveFront.modules.register({
    id: 'materials',
    name: '素材库',
    version: '0.1.0',
    description: '素材库 — 浏览、搜索、预览免费素材，一键应用到项目',

    dependencies: [],
    optionalDependencies: ['editor', 'preview', 'modline'],

    ui: {},

    commands: [
      { id: 'materials.open', label: '打开素材库', category: '素材库' },
      { id: 'materials.search', label: '搜索素材', category: '素材库' }
    ],

    shortcuts: [],

    menus: [
      {
        menuPath: '素材库',
        items: [
          { label: '打开素材库', command: 'materials.open', shortcut: '' },
          { label: '搜索素材', command: 'materials.search' }
        ]
      }
    ],

    contextMenus: [],

    events: {
      emits: [],
      listens: []
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx;

      ctx.commands.register('materials.open', () => {
        LiveFront.Materials.open();
      });

      ctx.commands.register('materials.search', () => {
        LiveFront.Materials.search();
      });

      console.log('[Materials] Module initialized');
    },

    destroy() {
      LiveFront.Materials.close();
    }
  });
})();
