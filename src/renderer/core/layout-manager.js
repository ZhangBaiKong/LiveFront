/* LiveFront 甯冨眬绠$悊鍣?*/
window.LiveFront = window.LiveFront || {};

LiveFront.Layout = {
  _sidebarVisible: true,
  _panelVisible: true,
  _guttersInitialized: false,

  init() {
    this._restoreLayout();
    this._initGutters();
    this._bindTitlebar();
  },

  toggleSidebar() {
    this._sidebarVisible = !this._sidebarVisible;
    const sidebar = document.getElementById('sidebar');
    const gutter = document.getElementById('gutterSidebar');
    if (this._sidebarVisible) { LiveFront.DOM.show(sidebar); LiveFront.DOM.show(gutter); }
    else { LiveFront.DOM.hide(sidebar); LiveFront.DOM.hide(gutter); }
    this._saveLayout();
  },

  togglePanel() {
    this._panelVisible = !this._panelVisible;
    const panel = document.getElementById('panel');
    const gutter = document.getElementById('gutterPanel');
    if (this._panelVisible) { LiveFront.DOM.show(panel); LiveFront.DOM.show(gutter); }
    else { LiveFront.DOM.hide(panel); LiveFront.DOM.hide(gutter); }
    this._saveLayout();
  },

  showWorkspace() {
    LiveFront.DOM.hide(document.getElementById('welcomePage'));
    LiveFront.DOM.show(document.getElementById('workspace'));
    // 展开预览区: 给 workspace 添加 preview-active 类
    document.getElementById('workspace')?.classList.add('preview-active');
  },

  showWelcome() {
    LiveFront.DOM.show(document.getElementById('welcomePage'));
    LiveFront.DOM.hide(document.getElementById('workspace'));
    // 折叠预览区
    document.getElementById('workspace')?.classList.remove('preview-active');
  },

  togglePreview() {
    const ws = document.getElementById('workspace');
    if (!ws) return;
    ws.classList.toggle('preview-active');
    this._saveLayout();
  },

  _initGutters() {
    if (this._guttersInitialized) return;
    this._guttersInitialized = true;
    this._setupGutter('gutterSidebar', 'sidebar', 'width', 160, 500);
    this._setupGutter('gutterPanel', 'panel', 'width', 200, 600);
    this._setupPreviewGutter();
  },

  _setupGutter(gutterId, targetId, prop, min, max) {
    const gutter = document.getElementById(gutterId);
    const target = document.getElementById(targetId);
    if (!gutter || !target) return;
    let startPos, startSize, isRight;
    isRight = gutterId === 'gutterPanel';

    const onMouseMove = (e) => {
      const delta = isRight ? (startPos - e.clientX) : (e.clientX - startPos);
      const newSize = Math.max(min, Math.min(max, startSize + delta));
      target.style[prop] = newSize + 'px';
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      this._saveLayout();
    };

    gutter.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startPos = e.clientX;
      startSize = target.getBoundingClientRect().width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  },

  _setupPreviewGutter() {
    const gutter = document.getElementById('gutterPreview');
    if (!gutter) return;
    let startPos, startMainWidth, startPreviewWidth, workspaceEl;

    const onMouseMove = (e) => {
      const delta = e.clientX - startPos;
      const workspaceRect = workspaceEl.getBoundingClientRect();
      const totalWidth = startMainWidth + startPreviewWidth;
      const gutterSize = gutter.getBoundingClientRect().width;
      const available = workspaceRect.width - gutterSize;
      const newMain = Math.max(200, Math.min(available - 200, startMainWidth + delta));
      const newPreview = available - newMain;
      // 更新 grid 列宽
      workspaceEl.style.gridTemplateColumns = newMain + 'px var(--gutter-size) ' + newPreview + 'px';
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    gutter.addEventListener('mousedown', (e) => {
      e.preventDefault();
      workspaceEl = document.getElementById('workspace');
      if (!workspaceEl || !workspaceEl.classList.contains('preview-active')) return;
      startPos = e.clientX;
      const mainEl = document.getElementById('workspaceMain');
      const previewEl = document.getElementById('workspacePreview');
      startMainWidth = mainEl ? mainEl.getBoundingClientRect().width : 400;
      startPreviewWidth = previewEl ? previewEl.getBoundingClientRect().width : 400;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  },

  _bindTitlebar() {
    const { $ } = LiveFront.DOM;
    $('#btnMinimize')?.addEventListener('click', () => window.api?.window.minimize());
    $('#btnMaximize')?.addEventListener('click', () => window.api?.window.maximize());
    $('#btnClose')?.addEventListener('click', () => window.api?.window.close());
  },

  _saveLayout() {
    LiveFront.Storage.set('layout', {
      sidebarWidth: document.getElementById('sidebar')?.style.width || '240px',
      panelWidth: document.getElementById('panel')?.style.width || '320px',
      sidebarVisible: this._sidebarVisible,
      panelVisible: this._panelVisible
    });
  },

  _restoreLayout() {
    const layout = LiveFront.Storage.get('layout', {});
    if (layout.sidebarWidth) document.getElementById('sidebar').style.width = layout.sidebarWidth;
    if (layout.panelWidth) document.getElementById('panel').style.width = layout.panelWidth;
    if (layout.sidebarVisible === false) this.toggleSidebar();
    if (layout.panelVisible === false) this.togglePanel();
  }
};
