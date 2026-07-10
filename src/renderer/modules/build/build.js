/* LiveFront Build Manager — 构建与导出管理 */
(function () {

  // ============ Toast 通知 ============
  function _showToast(msg, type) {
    type = type || 'info';
    const colors = { info: '#4a6cf7', success: '#34d399', error: '#f87171', warn: '#fbbf24' };
    const toast = document.createElement('div');
    toast.className = 'build-toast build-toast-' + type;
    toast.style.cssText = 'position:fixed;top:48px;right:20px;z-index:99999;padding:10px 18px;border-radius:8px;font-size:13px;color:#fff;background:' + (colors[type] || colors.info) + ';box-shadow:0 4px 16px rgba(0,0,0,0.35);animation:buildToastIn 0.25s ease;pointer-events:auto;max-width:420px;line-height:1.5;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  // ============ 检测构建工具 ============
  async function detectBuildTool(projectPath) {
    const pkgPath = projectPath.replace(/[\\\/]$/, '') + '/package.json';
    const exists = await LiveFront.Services.fileSystem.exists(pkgPath);
    if (!exists) return { type: 'none', reason: '当前项目不是 Node.js 项目（未找到 package.json）' };

    try {
      const raw = await LiveFront.Services.fileSystem.readFile(pkgPath);
      const pkg = JSON.parse(raw);
      const devDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});

      if (devDeps.vite || devDeps['@vitejs/plugin-vue'] || devDeps['@vitejs/plugin-react']) {
        return { type: 'vite', pkg };
      }
      if (devDeps.webpack || devDeps['webpack-cli'] || devDeps['webpack-dev-server']) {
        return { type: 'webpack', pkg };
      }
      if (devDeps.parcel || devDeps['parcel-bundler']) {
        return { type: 'parcel', pkg };
      }
      return { type: 'none', reason: '未检测到构建工具（vite / webpack / parcel）' };
    } catch (e) {
      return { type: 'error', reason: '读取 package.json 失败: ' + e.message };
    }
  }

  // ============ 在终端执行命令 ============
  function _runInTerminal(command) {
    // 激活终端 Tab 并执行命令
    if (LiveFront.PanelManager && LiveFront.PanelManager.activateTab) {
      LiveFront.PanelManager.activateTab('terminal');
    }
    const tm = LiveFront.TerminalManager;
    if (!tm) {
      _showToast('终端模块未初始化', 'error');
      return;
    }
    LiveFront.Services.terminal.write(_getActiveTermId(), command + '\r');
  }

  let _cachedTermId = null;
  function _getActiveTermId() {
    if (_cachedTermId) return _cachedTermId;
    return null;
  }

  // 确保终端可用
  async function _ensureTerminal() {
    const tm = LiveFront.TerminalManager;
    if (!tm) {
      _showToast('终端模块未初始化', 'error');
      return null;
    }
    const termId = await tm.createTerminal(LiveFront.state.currentProjectPath);
    if (!termId) {
      _showToast('无法创建终端', 'error');
      return null;
    }
    return new Promise(resolve => {
      setTimeout(() => resolve(termId), 300);
    });
  }

  // ============ 构建项目 ============
  async function runBuild() {
    const projectPath = LiveFront.state.currentProjectPath;
    if (!projectPath) {
      _showToast('请先打开一个项目', 'warn');
      return;
    }

    _showToast('正在检测构建工具...', 'info');
    const detected = await detectBuildTool(projectPath);

    if (detected.type === 'none' || detected.type === 'error') {
      _showToast(detected.reason, 'warn');
      return;
    }

    const buildCommands = {
      vite: 'npm run build',
      webpack: 'npm run build',
      parcel: 'npm run build'
    };

    const cmd = buildCommands[detected.type];
    _showToast('检测到 ' + detected.type.toUpperCase() + '，执行: ' + cmd, 'info');

    LiveFront.PanelManager.activateTab('terminal');

    const termId = await _ensureTerminal();
    if (termId) {
      setTimeout(() => {
        LiveFront.Services.terminal.write(termId, cmd + '\r');
      }, 200);
    }
  }

  // ============ 启动开发服务器 ============
  async function runDev() {
    const projectPath = LiveFront.state.currentProjectPath;
    if (!projectPath) {
      _showToast('请先打开一个项目', 'warn');
      return;
    }

    _showToast('正在检测构建工具...', 'info');
    const detected = await detectBuildTool(projectPath);

    if (detected.type === 'none' || detected.type === 'error') {
      _showToast(detected.reason, 'warn');
      return;
    }

    const devCommands = {
      vite: 'npm run dev',
      webpack: 'npm run dev',
      parcel: 'npm start'
    };

    const cmd = devCommands[detected.type];
    _showToast('检测到 ' + detected.type.toUpperCase() + '，执行: ' + cmd, 'info');

    LiveFront.PanelManager.activateTab('terminal');

    const termId = await _ensureTerminal();
    if (termId) {
      setTimeout(() => {
        LiveFront.Services.terminal.write(termId, cmd + '\r');
      }, 200);
    }
  }

  // ============ 导出 ZIP ============
  async function exportZip() {
    const projectPath = LiveFront.state.currentProjectPath;
    if (!projectPath) {
      _showToast('请先打开一个项目', 'warn');
      return;
    }

    const projectName = projectPath.split(/[/\\]/).pop();
    const defaultName = projectName + '.zip';

    const result = await window.api.dialog.saveFile({
      title: '导出为 ZIP',
      defaultPath: defaultName,
      filters: [{ name: 'ZIP 文件', extensions: ['zip'] }]
    });

    if (!result) return;
    const outputPath = typeof result === 'string' ? result : result.filePath;

    _showToast('正在打包文件...', 'info');

    try {
      const exportResult = await window.api.project.exportZip({
        projectPath: projectPath,
        outputPath: outputPath
      });

      if (exportResult && exportResult.success) {
        const sizeKB = Math.round(exportResult.size / 1024);
        const sizeText = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';
        _showToast('项目已导出到 ' + outputPath + '（' + sizeText + '）', 'success');
      } else {
        _showToast('导出失败: ' + (exportResult.error || '未知错误'), 'error');
      }
    } catch (e) {
      _showToast('导出失败: ' + e.message, 'error');
    }
  }

  // ============ 部署 Vercel ============
  async function deployVercel() {
    _showToast('正在打开 Vercel...（当前请使用"导出为 ZIP"方式部署）', 'info');
    try {
      await window.api.shell.openExternal('https://vercel.com');
    } catch (e) {
      console.warn('[Build] Failed to open Vercel:', e);
    }
  }

  // ============ 部署 Netlify ============
  async function deployNetlify() {
    _showToast('正在打开 Netlify...（当前请使用"导出为 ZIP"方式部署）', 'info');
    try {
      await window.api.shell.openExternal('https://netlify.com');
    } catch (e) {
      console.warn('[Build] Failed to open Netlify:', e);
    }
  }

  // ============ 注入 CSS 动画 ============
  function _injectAnimations() {
    if (document.getElementById('build-animations')) return;
    const style = document.createElement('style');
    style.id = 'build-animations';
    style.textContent = '@keyframes buildToastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  // ============ 暴露全局 API ============
  window.LiveFront.BuildManager = {
    runBuild,
    runDev,
    exportZip,
    deployVercel,
    deployNetlify,
    detectBuildTool,
    init() {
      _injectAnimations();
    }
  };
})();