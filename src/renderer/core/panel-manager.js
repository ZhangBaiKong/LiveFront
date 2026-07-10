/* LiveFront 面板管理器 — 右侧面板 Tab 框架 */
window.LiveFront = window.LiveFront || {};

LiveFront.PanelManager = {
  _tabs: [],
  _activeTabId: null,
  _contents: {},

  init() {
    this._render();
  },

  registerTab(tab) {
    // tab: { id, label, icon, badge, render(container), onActivate(), onDeactivate() }
    if (this._tabs.find(t => t.id === tab.id)) return;
    this._tabs.push(tab);
    if (tab.render) {
      this._contents[tab.id] = tab.render;
    }
    this._render();
    // 第一个 Tab 自动激活
    if (this._tabs.length === 1) {
      this.activateTab(tab.id);
    }
  },

  unregisterTab(tabId) {
    this._tabs = this._tabs.filter(t => t.id !== tabId);
    delete this._contents[tabId];
    if (this._activeTabId === tabId) {
      this._activeTabId = this._tabs.length > 0 ? this._tabs[0].id : null;
    }
    this._render();
    if (this._activeTabId) this._showTabContent(this._activeTabId);
  },

  activateTab(tabId) {
    const tab = this._tabs.find(t => t.id === tabId);
    if (!tab) return;

    // 通知旧 Tab 停用
    const oldTab = this._tabs.find(t => t.id === this._activeTabId);
    if (oldTab && oldTab.onDeactivate) oldTab.onDeactivate();

    this._activeTabId = tabId;
    this._render();
    this._showTabContent(tabId);

    // 通知新 Tab 激活
    if (tab.onActivate) tab.onActivate();
  },

  getActiveTab() {
    return this._tabs.find(t => t.id === this._activeTabId);
  },

  updateBadge(tabId, badge) {
    const tab = this._tabs.find(t => t.id === tabId);
    if (tab) {
      tab.badge = badge;
      this._render();
    }
  },

  _render() {
    const tabsContainer = document.getElementById('panelTabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    for (const tab of this._tabs) {
      const el = LiveFront.DOM.el('div', {
        class: 'panel-tab' + (tab.id === this._activeTabId ? ' active' : ''),
        'data-tab': tab.id
      });

      if (tab.icon) {
        el.appendChild(LiveFront.DOM.el('span', { class: 'panel-tab-icon' }, tab.icon));
      }
      el.appendChild(LiveFront.DOM.el('span', {}, tab.label));
      if (tab.badge !== undefined && tab.badge !== null) {
        el.appendChild(LiveFront.DOM.el('span', { class: 'panel-tab-badge' }, String(tab.badge)));
      }

      el.addEventListener('click', () => this.activateTab(tab.id));
      tabsContainer.appendChild(el);
    }
  },

  _showTabContent(tabId) {
    const container = document.getElementById('panelContent');
    if (!container) return;
    container.innerHTML = '';

    const renderFn = this._contents[tabId];
    if (renderFn) {
      renderFn(container);
    } else {
      container.innerHTML = '<div style="padding:20px;color:var(--text-muted);text-align:center;">无内容</div>';
    }
  }
};