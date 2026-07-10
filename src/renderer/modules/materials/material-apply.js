/* LiveFront 素材库 - 素材应用到项目逻辑 */
(function () {
  window.LiveFront = window.LiveFront || {};

  function _showToast(msg) {
    let toast = document.querySelector('.materials-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'materials-toast';
      toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);' +
        'background:var(--bg-elevated,#1e293b);border:1px solid var(--accent,#3b82f6);border-radius:8px;' +
        'padding:8px 20px;font-size:13px;color:var(--accent,#3b82f6);box-shadow:0 8px 32px rgba(0,0,0,0.3);z-index:10001;' +
        'opacity:0;pointer-events:none;transition:opacity 200ms ease,transform 200ms ease;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
  }

  function _getActiveCSSFile() {
    const activePath = LiveFront.Editor?.getActivePath?.();
    if (activePath && /\.(css|scss|less)$/i.test(activePath)) return activePath;
    const openFiles = LiveFront.Editor?.getOpenFiles?.() || [];
    const cssEntry = openFiles.find(f => /\.(css|scss|less)$/i.test(f.path));
    return cssEntry ? cssEntry.path : null;
  }

  function _getActiveHTMLFile() {
    const activePath = LiveFront.Editor?.getActivePath?.();
    if (activePath && /\.html?$/i.test(activePath)) return activePath;
    const openFiles = LiveFront.Editor?.getOpenFiles?.() || [];
    const htmlEntry = openFiles.find(f => /\.html?$/i.test(f.path));
    return htmlEntry ? htmlEntry.path : null;
  }

  function _getActiveJSFile() {
    const activePath = LiveFront.Editor?.getActivePath?.();
    if (activePath && /\.js$/i.test(activePath)) return activePath;
    const openFiles = LiveFront.Editor?.getOpenFiles?.() || [];
    const jsEntry = openFiles.find(f => /\.js$/i.test(f.path));
    return jsEntry ? jsEntry.path : null;
  }

  function _getProjectRoot() {
    return LiveFront.state.currentProjectPath || null;
  }

  async function _ensureFile(filePath, defaultContent) {
    const exists = await LiveFront.Services.fileSystem.exists(filePath);
    if (!exists) {
      const dir = filePath.replace(/[/\\][^/\\]+$/, '');
      await LiveFront.Services.fileSystem.createDir(dir);
      await LiveFront.Services.fileSystem.writeFile(filePath, defaultContent || '');
    }
    return filePath;
  }

  async function _appendToFile(filePath, content) {
    let existing = '';
    try {
      existing = await LiveFront.Services.fileSystem.readFile(filePath);
    } catch (e) {
      existing = '';
    }
    const newContent = existing ? existing + '\n\n' + content : content;
    await LiveFront.Services.fileSystem.writeFile(filePath, newContent);
    const entry = LiveFront.Editor?.getEntry?.(filePath);
    if (entry && entry.model) {
      entry.model.setValue(newContent);
    }
  }

  async function _applyFont(material) {
    const projectRoot = _getProjectRoot();
    if (!projectRoot) {
      _showToast('请先打开一个项目');
      return false;
    }

    let cssFile = _getActiveCSSFile();
    if (!cssFile) {
      cssFile = projectRoot + '/assets/fonts.css';
      await _ensureFile(cssFile, '/* LiveFront 字体样式 */\n');
    }

    const code = material.code.css;
    await _appendToFile(cssFile, code);

    if (material.importUrl) {
      const htmlFile = _getActiveHTMLFile();
      if (htmlFile) {
        let htmlContent = await LiveFront.Services.fileSystem.readFile(htmlFile);
        if (htmlContent && !htmlContent.includes(material.importUrl)) {
          htmlContent = htmlContent.replace('</head>', '  <link href="' + material.importUrl + '" rel="stylesheet">\n</head>');
          await LiveFront.Services.fileSystem.writeFile(htmlFile, htmlContent);
          const entry = LiveFront.Editor?.getEntry?.(htmlFile);
          if (entry && entry.model) entry.model.setValue(htmlContent);
        }
      }
    }

    _showToast('字体已应用到项目: ' + material.name);
    return true;
  }

  async function _applyColor(material) {
    const projectRoot = _getProjectRoot();
    if (!projectRoot) {
      _showToast('请先打开一个项目');
      return false;
    }

    let cssFile = _getActiveCSSFile();
    if (!cssFile) {
      cssFile = projectRoot + '/assets/variables.css';
      await _ensureFile(cssFile, '/* LiveFront 配色变量 */\n');
    }

    const code = material.code.css;
    await _appendToFile(cssFile, code);

    _showToast('配色已应用到项目: ' + material.name);
    return true;
  }

  async function _applyComponent(material) {
    const projectRoot = _getProjectRoot();
    if (!projectRoot) {
      _showToast('请先打开一个项目');
      return false;
    }

    if (material.code.html) {
      let htmlFile = _getActiveHTMLFile();
      if (!htmlFile) {
        htmlFile = projectRoot + '/index.html';
        await _ensureFile(htmlFile, '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <title>LiveFront Project</title>\n</head>\n<body>\n</body>\n</html>');
      }
      let htmlContent = await LiveFront.Services.fileSystem.readFile(htmlFile);
      if (htmlContent) {
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', '  <!-- ' + material.name + ' -->\n  ' + material.code.html + '\n\n</body>');
        } else {
          htmlContent += '\n<!-- ' + material.name + ' -->\n' + material.code.html;
        }
        await LiveFront.Services.fileSystem.writeFile(htmlFile, htmlContent);
        const entry = LiveFront.Editor?.getEntry?.(htmlFile);
        if (entry && entry.model) entry.model.setValue(htmlContent);
      }
    }

    if (material.code.css) {
      let cssFile = _getActiveCSSFile();
      if (!cssFile) {
        cssFile = projectRoot + '/assets/components.css';
        await _ensureFile(cssFile, '/* LiveFront 组件样式 */\n');
      }
      await _appendToFile(cssFile, '/* ' + material.name + ' */\n' + material.code.css);
    }

    if (material.code.js) {
      let jsFile = _getActiveJSFile();
      if (!jsFile) {
        jsFile = projectRoot + '/assets/components.js';
        await _ensureFile(jsFile, '// LiveFront 组件脚本\n');
      }
      await _appendToFile(jsFile, '// ' + material.name + '\n' + material.code.js);
    }

    _showToast('组件已应用到项目: ' + material.name);
    return true;
  }

  async function _applyIcon(material) {
    const code = material.code.html || material.code.css || '';
    try {
      await navigator.clipboard.writeText(code);
      _showToast('图标代码已复制到剪贴板');
    } catch (e) {
      _showToast('复制失败，请手动复制');
    }
    return true;
  }

  async function _applyBackground(material) {
    const projectRoot = _getProjectRoot();
    if (!projectRoot) {
      _showToast('请先打开一个项目');
      return false;
    }

    let cssFile = _getActiveCSSFile();
    if (!cssFile) {
      cssFile = projectRoot + '/assets/backgrounds.css';
      await _ensureFile(cssFile, '/* LiveFront 背景样式 */\n');
    }

    const code = material.code.css;
    await _appendToFile(cssFile, '/* ' + material.name + ' */\n' + code);

    _showToast('背景已应用到项目: ' + material.name);
    return true;
  }

  async function _applyLoading(material) {
    return await _applyComponent(material);
  }

  async function applyMaterial(material) {
    let success = false;

    switch (material.category) {
      case '字体':
        success = await _applyFont(material);
        break;
      case '图标':
        success = await _applyIcon(material);
        break;
      case '配色':
        success = await _applyColor(material);
        break;
      case '组件':
        success = await _applyComponent(material);
        break;
      case '背景':
        success = await _applyBackground(material);
        break;
      case '加载状态':
        success = await _applyLoading(material);
        break;
      default:
        _showToast('未知素材类型: ' + material.category);
        return false;
    }

    if (success) {
      try {
        LiveFront.Preview?.refresh?.();
      } catch (e) { /* ignore */ }

      try {
        LiveFront.EventBus.emit('modification:created', {
          label: '应用素材: ' + material.name,
          source: 'material'
        });
      } catch (e) { /* ignore */ }
    }

    return success;
  }

  async function copyCode(material) {
    let codeStr = '';
    if (material.code.css) codeStr += material.code.css + '\n';
    if (material.code.html) codeStr += material.code.html + '\n';
    if (material.code.js) codeStr += material.code.js + '\n';
    codeStr = codeStr.trim();

    try {
      await navigator.clipboard.writeText(codeStr);
      _showToast('代码已复制到剪贴板');
    } catch (e) {
      _showToast('复制失败，请手动复制');
    }
  }

  LiveFront.MaterialApply = {
    applyMaterial,
    copyCode,
    _showToast
  };
})();
