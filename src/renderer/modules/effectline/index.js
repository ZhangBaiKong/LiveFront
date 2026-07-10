/* LiveFront 效果线模块 */
(function () {
  LiveFront.modules.register({
    id: 'effectline',
    name: '效果线',
    version: '0.1.0',
    description: '效果线 — 选中元素→选择效果→生成 CSS→预览区即时生效→修改线记录',

    dependencies: [],
    optionalDependencies: ['preview', 'modline', 'editor'],

    ui: {},

    commands: [
      { id: 'effectline.addEffect', label: '添加效果', category: '效果' },
      { id: 'effectline.exportCode', label: '导出代码', category: '效果' },
      { id: 'effectline.toggle', label: '切换效果线显示', category: '效果' }
    ],

    shortcuts: [
      { key: 'Ctrl+Shift+E', command: 'effectline.toggle' }
    ],

    menus: [
      {
        menuPath: '效果',
        items: [
          { label: '添加效果', command: 'effectline.addEffect' },
          { label: '导出效果代码', command: 'effectline.exportCode' },
          { separator: true },
          { label: '查看效果列表', command: 'effectline.toggle' }
        ]
      }
    ],

    contextMenus: [],

    events: {
      emits: [
        { name: 'effect:created', payload: '{ id, name, category, selector, cssCode, jsCode }' },
        { name: 'effect:updated', payload: '{ id, name, ... }' },
        { name: 'effect:deleted', payload: '{ id }' },
        { name: 'effect:toggled', payload: '{ id, enabled }' }
      ],
      listens: ['element:selected', 'element:deselected']
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx;
      this._visible = true;

      // 初始化面板
      LiveFront.EffectLine.initPanel();

      // 初始化快捷工具栏
      LiveFront.EffectLine.initToolbar();

      // 监听元素选中
      ctx.eventBus.on('element:selected', (data) => {
        LiveFront.EffectLine.setSelectedElement(data);
        LiveFront.EffectLine.showToolbar();
      });

      // 监听元素取消选中
      ctx.eventBus.on('element:deselected', () => {
        LiveFront.EffectLine.setSelectedElement(null);
        LiveFront.EffectLine.hideToolbar();
      });

      // 注册命令
      ctx.commands.register('effectline.toggle', () => {
        const container = document.getElementById('effectlineContainer');
        if (container) {
          this._visible = !this._visible;
          container.style.display = this._visible ? 'flex' : 'none';
        }
      });

      ctx.commands.register('effectline.addEffect', () => {
        // 如果有选中元素，显示工具栏
        const sel = LiveFront.EffectLine.getSelectedElement();
        if (sel) {
          LiveFront.EffectLine.showToolbar();
        } else {
          _showToast('请先在预览区选中一个元素');
        }
      });

      ctx.commands.register('effectline.exportCode', () => {
        LiveFront.EffectLine.exportCode();
      });

      // 监听预览区刷新后重新注入效果
      ctx.eventBus.on('preview:ready', () => {
        setTimeout(() => {
          LiveFront.EffectLine.InjectManager.refreshAll();
        }, 500);
      });

      console.log('[EffectLine] Module initialized');
    },

    destroy() {
      LiveFront.EffectLine.InjectManager.removeAll();
    }
  });

  function _showToast(msg) {
    let toast = document.querySelector('.effectline-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'effectline-toast';
      toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);' +
        'background:var(--bg-elevated);border:1px solid var(--accent);border-radius:var(--radius-md);' +
        'padding:8px 20px;font-size:12px;color:var(--accent);box-shadow:var(--shadow-lg);z-index:1001;' +
        'opacity:0;pointer-events:none;transition:opacity 200ms ease,transform 200ms ease;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
  }
})();