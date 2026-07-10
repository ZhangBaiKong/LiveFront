/* LiveFront 菜单管理器 */
window.LiveFront = window.LiveFront || {};

LiveFront.MenuManager = {
  _menus: [],
  _activeMenu: null,

  register(menuPath, items) {
    let menu = this._menus.find(m => m.label === menuPath);
    if (!menu) { menu = { label: menuPath, items: [] }; this._menus.push(menu); }
    menu.items.push(...items);
  },

  build() {
    const container = document.getElementById('menubar');
    if (!container) return;
    container.innerHTML = '';

    // 默认菜单
    const defaults = ['文件', '编辑', '视图', '工具', '帮助'];
    for (const label of defaults) {
      if (!this._menus.find(m => m.label === label)) {
        this._menus.push({ label, items: [] });
      }
    }

    for (const menu of this._menus) {
      const el = LiveFront.DOM.el('div', { class: 'menu-item', 'data-menu': menu.label }, menu.label);
      el.addEventListener('click', (e) => { e.stopPropagation(); this._toggle(menu, el); });
      el.addEventListener('mouseenter', () => { if (this._activeMenu) this._toggle(menu, el); });
      container.appendChild(el);
    }

    document.addEventListener('click', () => this._closeAll());
  },

  _toggle(menu, anchor) {
    this._closeAll();
    if (!menu.items.length) return;
    const dropdown = LiveFront.DOM.el('div', { class: 'menu-dropdown' });
    for (const item of menu.items) {
      if (item.separator) { dropdown.appendChild(LiveFront.DOM.el('div', { class: 'menu-separator' })); continue; }
      const row = LiveFront.DOM.el('div', { class: 'menu-dropdown-item' });
      row.appendChild(LiveFront.DOM.el('span', {}, item.label));
      if (item.shortcut) row.appendChild(LiveFront.DOM.el('span', { class: 'shortcut' }, item.shortcut));
      row.addEventListener('click', (e) => { e.stopPropagation(); this._closeAll(); if (item.command) LiveFront.Commands.execute(item.command); });
      dropdown.appendChild(row);
    }
    anchor.classList.add('active');
    anchor.appendChild(dropdown);
    this._activeMenu = { anchor, dropdown };
  },

  _closeAll() {
    document.querySelectorAll('.menu-dropdown').forEach(d => d.remove());
    document.querySelectorAll('.menu-item.active').forEach(m => m.classList.remove('active'));
    this._activeMenu = null;
  }
};
