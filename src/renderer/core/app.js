/* LiveFront 应用入口 */
(async function () {
  console.log('[App] LiveFront starting...');

  LiveFront.Shortcuts.init();
  LiveFront.Layout.init();
  LiveFront.PanelManager.init();

  // —— 核心命令 ——
  LiveFront.Commands.register('core.toggleSidebar', () => LiveFront.Layout.toggleSidebar(), { label: 'Toggle Sidebar' });
  LiveFront.Commands.register('core.togglePanel', () => LiveFront.Layout.togglePanel(), { label: 'Toggle Panel' });
  LiveFront.Commands.register('core.openFolder', () => LiveFront.Commands.execute('filetree.open'), { label: 'Open Folder' });
  LiveFront.Commands.register('core.toggleFullscreen', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }, { label: 'Toggle Fullscreen' });

  LiveFront.Shortcuts.register('Ctrl+B', 'core.toggleSidebar');
  LiveFront.Shortcuts.register('Ctrl+J', 'core.togglePanel');
  LiveFront.Shortcuts.register('F11', 'core.toggleFullscreen');

  // —— 菜单 ——
  LiveFront.MenuManager.register('视图', [
    { label: 'Toggle Sidebar', command: 'core.toggleSidebar', shortcut: 'Ctrl+B' },
    { label: 'Toggle Panel', command: 'core.togglePanel', shortcut: 'Ctrl+J' },
    { separator: true },
    { label: 'Fullscreen', command: 'core.toggleFullscreen', shortcut: 'F11' }
  ]);
  LiveFront.MenuManager.register('工具', [
    { label: 'LiveFront Settings', command: 'settings.open', shortcut: 'Ctrl+,' },
    { separator: true },
    { label: 'Open AI Panel', command: 'ai.openPanel', shortcut: 'Ctrl+Shift+A' }
  ]);
  LiveFront.MenuManager.register('帮助', [
    { label: 'About LiveFront', command: null }
  ]);

  // —— 面板 Tab（输出 + 终端，属性 Tab 由 props-panel 模块注册）——
  LiveFront.PanelManager.registerTab({
    id: 'output',
    label: '输出',
    icon: '',
    render(container) {
      const logArea = document.createElement('div');
      logArea.id = 'outputLog';
      logArea.style.cssText = 'font-family:var(--font-mono);font-size:11px;padding:8px 12px;color:var(--text-secondary);white-space:pre-wrap;overflow:auto;height:100%;';
      logArea.textContent = '[LiveFront] 输出面板就绪\n';
      container.appendChild(logArea);
      LiveFront._outputLog = logArea;
    }
  });
  // Terminal tab is registered by the terminal module

  // —— 欢迎页——
  document.getElementById('btnOpenFolder')?.addEventListener('click', async () => {
    console.log('[App] btnOpenFolder clicked');
    try {
      const result = await LiveFront.Commands.execute('filetree.open');
      console.log('[App] filetree.open result:', result);
    } catch (e) {
      console.error('[App] filetree.open failed:', e);
    }
  });
  document.getElementById('btnNewProject')?.addEventListener('click', async () => {
    console.log('[App] btnNewProject clicked');
    try {
      const result = await LiveFront.Commands.execute('filetree.open');
      console.log('[App] filetree.open result:', result);
    } catch (e) {
      console.error('[App] filetree.open failed:', e);
    }
  });
  _renderRecentProjects();

  // —— 初始化所有模块——
  await LiveFront.ModuleLoader.initAll();

  // —— 项目事件 ——
  LiveFront.EventBus.on('project:opened', (data) => {
    LiveFront.Services.app.addRecentProject(data.path);
    LiveFront.state.currentProjectPath = data.path;
    LiveFront.Services.fileSystem.watch(data.path);
    _logOutput('[Project] Opened: ' + data.path.split(/[/\\]/).pop());
    _renderRecentProjects();
  });

  // —— chokidar 事件 ——
  LiveFront.Services.fileSystem.onFileChanged((filePath) => {
    const name = filePath.split(/[/\\]/).pop();
    _logOutput('[Watch] Changed: ' + name);
    LiveFront.EventBus.emit('file:changed', { path: filePath, name });
  });
  LiveFront.Services.fileSystem.onFileAdded((filePath) => {
    _logOutput('[Watch] Added: ' + filePath.split(/[/\\]/).pop());
    LiveFront.EventBus.emit('file:added', { path: filePath, name: filePath.split(/[/\\]/).pop() });
  });
  LiveFront.Services.fileSystem.onFileRemoved((filePath) => {
    _logOutput('[Watch] Removed: ' + filePath.split(/[/\\]/).pop());
    LiveFront.EventBus.emit('file:removed', { path: filePath, name: filePath.split(/[/\\]/).pop() });
  });

  LiveFront.EventBus.on('file:saved', (data) => _logOutput('[Save] ' + data.path.split(/[/\\]/).pop()));
  LiveFront.EventBus.on('element:selected', (data) => _logOutput('[Element] Selected: ' + data.selector));

  // 恢复上次项目
  const lastProject = LiveFront.Storage.get('lastProjectPath');
  if (lastProject) {
    const exists = await LiveFront.Services.fileSystem.exists(lastProject);
    if (exists) LiveFront.EventBus.emit('project:open', lastProject);
  }

  console.log('[App] LiveFront ready');
  console.log('[App] Modules:', LiveFront.modules.getAll().map(m => m.id).join(', '));
  function _renderRecentProjects() {
    const c = document.getElementById('recentProjects');
    if (!c) return;
    const recent = LiveFront.Services.app.getRecentProjects();
    if (!recent?.length) {
      c.innerHTML = '<p style="color:var(--text-muted);font-size:12px;margin-top:8px;">No recent projects</p>';
      return;
    }
    c.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'welcome-recent-title';
    t.textContent = 'Recent Projects';
    c.appendChild(t);
    for (const p of recent.slice(0, 5)) {
      const item = document.createElement('div');
      item.className = 'welcome-recent-item';
      item.innerHTML = '<span style="font-size:14px;">&#128194;</span><span>' + p.split(/[\/\\]/).pop() + '</span>';
      item.title = p;
      item.addEventListener('click', () => LiveFront.EventBus.emit('project:open', p));
      c.appendChild(item);
    }
  }

  function _logOutput(msg) {
    const el = document.getElementById('outputLog');
    if (el) {
      el.textContent += '[' + new Date().toLocaleTimeString() + '] ' + msg + '\n';
      el.scrollTop = el.scrollHeight;
    }
  }
})();
