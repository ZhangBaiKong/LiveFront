/* LiveFront 模块加载器 */
window.LiveFront = window.LiveFront || {};

LiveFront.ModuleLoader = {
  async initAll() {
    const modules = LiveFront.modules.getAll();
    console.log(`[ModuleLoader] Initializing ${modules.length} modules...`);

    // 拓扑排序
    const sorted = this._topoSort(modules);

    // 为每个模块构建 ctx
    const ctx = {
      eventBus: LiveFront.EventBus,
      commands: LiveFront.Commands,
      shortcuts: LiveFront.Shortcuts,
      storage: LiveFront.Storage,
      services: LiveFront.Services,
      layout: LiveFront.Layout,
      ipc: LiveFront.ipc,
      modules: LiveFront.modules,
      dom: LiveFront.DOM
    };

    // 按顺序初始化
    for (const mod of sorted) {
      try {
        if (mod.init) await mod.init(ctx);
        console.log(`[ModuleLoader] Initialized: ${mod.id}`);
      } catch (e) {
        console.error(`[ModuleLoader] Failed to init "${mod.id}":`, e);
      }
    }

    // 收集并构建菜单
    for (const mod of sorted) {
      if (mod.menus) {
        for (const menu of mod.menus) {
          if (menu.menuPath && menu.items) {
            LiveFront.MenuManager.register(menu.menuPath, menu.items);
          }
        }
      }
    }
    LiveFront.MenuManager.build();

    // 注册快捷键
    for (const mod of sorted) {
      if (mod.shortcuts) {
        for (const s of mod.shortcuts) {
          LiveFront.Shortcuts.register(s.key, s.command, s.when);
        }
      }
    }

    // 注册右键菜单
    for (const mod of sorted) {
      if (mod.contextMenus) {
        for (const cm of mod.contextMenus) {
          LiveFront.ContextMenu.register(cm.target, cm.items);
        }
      }
    }

    // 渲染状态栏
    for (const mod of sorted) {
      if (mod.ui && mod.ui.statusbar) {
        for (const item of mod.ui.statusbar) {
          const container = document.getElementById(item.position === 'right' ? 'statusbarRight' : 'statusbarLeft');
          if (container) {
            const el = LiveFront.DOM.el('span', { class: 'statusbar-item', title: item.tooltip || '' }, item.text);
            if (item.onClick) el.addEventListener('click', item.onClick);
            container.appendChild(el);
          }
        }
      }
    }

    console.log('[ModuleLoader] All modules initialized');
  },

  _topoSort(modules) {
    const map = new Map(modules.map(m => [m.id, m]));
    const visited = new Set();
    const sorted = [];
    const visit = (mod) => {
      if (visited.has(mod.id)) return;
      visited.add(mod.id);
      for (const dep of (mod.dependencies || [])) {
        if (map.has(dep)) visit(map.get(dep));
      }
      sorted.push(mod);
    };
    modules.forEach(visit);
    return sorted;
  }
};
