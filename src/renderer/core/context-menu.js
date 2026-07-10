/* LiveFront 右键菜单管理器 */
window.LiveFront = window.LiveFront || {};

LiveFront.ContextMenu = {
  _items: {},

  register(target, items) {
    if (!this._items[target]) this._items[target] = [];
    this._items[target].push(...items);
  },

  show(target, x, y) {
    this.hide();
    const items = this._items[target] || [];
    if (!items.length) return;
    const menu = document.getElementById('contextMenu');
    menu.innerHTML = '';
    for (const item of items) {
      if (item.separator) { menu.appendChild(LiveFront.DOM.el('div', { class: 'context-menu-separator' })); continue; }
      const row = LiveFront.DOM.el('div', { class: 'context-menu-item' }, item.label);
      row.addEventListener('click', () => { this.hide(); if (item.command) LiveFront.Commands.execute(item.command); });
      menu.appendChild(row);
    }
    // 边界检查
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - menu.offsetHeight;
    menu.style.left = Math.min(x, maxX) + 'px';
    menu.style.top = Math.min(y, maxY) + 'px';
    LiveFront.DOM.show(menu);
    document.addEventListener('click', () => this.hide(), { once: true });
  },

  hide() { LiveFront.DOM.hide(document.getElementById('contextMenu')); }
};
