/* LiveFront 效果线核心逻辑 */
window.LiveFront = window.LiveFront || {};

(function () {
  // ============ Category 映射 ============
  const CAT_LABELS = {
    click: '点击',
    hover: '悬停',
    scroll: '滚动',
    page: '页面',
    transition: '过渡'
  };
  const CAT_ORDER = ['click', 'hover', 'scroll', 'page', 'transition'];

  // ============ 效果存储 ============
  const EffectStore = {
    _effects: [],
    _nextId: 1,

    add(effect) {
      effect.id = effect.id || ('eff-' + (this._nextId++));
      effect.enabled = true;
      effect.createdAt = Date.now();
      this._effects.push(effect);
      return effect;
    },

    remove(id) {
      const idx = this._effects.findIndex(e => e.id === id);
      if (idx >= 0) {
        const removed = this._effects.splice(idx, 1)[0];
        return removed;
      }
      return null;
    },

    get(id) {
      return this._effects.find(e => e.id === id) || null;
    },

    getAll() {
      return this._effects;
    },

    getEnabled() {
      return this._effects.filter(e => e.enabled);
    },

    toggle(id) {
      const eff = this.get(id);
      if (eff) {
        eff.enabled = !eff.enabled;
        return eff;
      }
      return null;
    },

    update(id, data) {
      const eff = this.get(id);
      if (!eff) return null;
      Object.assign(eff, data);
      return eff;
    },

    clear() {
      this._effects = [];
      this._nextId = 1;
    }
  };

  // ============ CSS/JS 注入管理 ============
  const InjectManager = {
    _styleId: '__lf_effectline_styles',
    _injected: new Map(),

    _ensureStyleTag() {
      let tag = document.getElementById(this._styleId);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = this._styleId;
        document.head.appendChild(tag);
      }
      return tag;
    },

    inject(effect) {
      const wv = LiveFront.Preview?.getWebview();
      if (!wv) return;

      const cssCode = effect.cssCode || '';
      const jsCode = effect.jsCode || '';
      const effId = effect.id;

                  const safeCSS = cssCode.replace(/\\/g, '\\\\').replace(/\//g, '\\/').replace(/\$/g, '$$$$$$$$');

      let injectCode = '(function(){\n';
      injectCode += '  var styleTag = document.getElementById("__lf_effect_' + effId + '");\n';
      injectCode += '  if (!styleTag) {\n';
      injectCode += '    styleTag = document.createElement("style");\n';
      injectCode += '    styleTag.id = "__lf_effect_' + effId + '";\n';
      injectCode += '    document.head.appendChild(styleTag);\n';
      injectCode += '  }\n';
      injectCode += '  styleTag.textContent = ' + JSON.stringify(cssCode) + ';\n';

      if (jsCode) {
        injectCode += '  var scriptTag = document.getElementById("__lf_effect_js_' + effId + '");\n';
        injectCode += '  if (!scriptTag) {\n';
        injectCode += '    scriptTag = document.createElement("script");\n';
        injectCode += '    scriptTag.id = "__lf_effect_js_' + effId + '";\n';
        injectCode += '    scriptTag.textContent = ' + JSON.stringify(jsCode) + ';\n';
        injectCode += '    document.head.appendChild(scriptTag);\n';
        injectCode += '  }\n';
      }

      injectCode += '})();';

      wv.executeJavaScript(injectCode).catch(err => {
        console.warn('[EffectLine] inject failed for', effId, err);
      });

      this._injected.set(effId, true);
    },

    remove(effectId) {
      const wv = LiveFront.Preview?.getWebview();
      if (!wv) return;

      var code = '(function(){\n';
      code += '  var s = document.getElementById("__lf_effect_' + effectId + '");\n';
      code += '  if (s) s.remove();\n';
      code += '  var j = document.getElementById("__lf_effect_js_' + effectId + '");\n';
      code += '  if (j) j.remove();\n';
      code += '})();';

      wv.executeJavaScript(code).catch(() => {});
      this._injected.delete(effectId);
    },

    removeAll() {
      for (const [effId] of this._injected) {
        this.remove(effId);
      }
    },

    refreshAll() {
      const enabled = EffectStore.getEnabled();
      for (const [effId] of this._injected) {
        this.remove(effId);
      }
      this._injected.clear();
      for (const eff of enabled) {
        this.inject(eff);
      }
    }
  };

  // ============ 快捷工具栏 ============
  let _toolbarEl = null;
  let _activeDropdown = null;
  let _selectedElementData = null;

  function _createToolbar() {
    if (_toolbarEl) _toolbarEl.remove();

    _toolbarEl = document.createElement('div');
    _toolbarEl.className = 'effect-toolbar';
    _toolbarEl.style.display = 'none';

    const previewArea = document.getElementById('workspacePreview');
    if (previewArea) {
      previewArea.style.position = 'relative';
      previewArea.appendChild(_toolbarEl);
    } else {
      document.body.appendChild(_toolbarEl);
    }

    const categories = [
      { key: 'click', label: '\u70B9\u51FB' },
      { key: 'hover', label: '\u60AC\u505C' },
      { key: 'scroll', label: '\u6EDA\u52A8' },
      { key: 'page', label: '\u9875\u9762' },
      { key: 'transition', label: '\u8FC7\u6E21' }
    ];

    for (const cat of categories) {
      const btn = document.createElement('button');
      btn.className = 'effect-toolbar-btn';
      btn.textContent = cat.label + '\u25BE';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _showDropdown(btn, cat.key);
      });
      _toolbarEl.appendChild(btn);
    }
  }

  function _showDropdown(anchorBtn, category) {
    _closeDropdown();

    const presets = LiveFront.EffectPresets.filter(p => p.category === category);
    if (presets.length === 0) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'effect-dropdown';

    for (const preset of presets) {
      const item = document.createElement('div');
      item.className = 'effect-dropdown-item';

      const dot = document.createElement('span');
      dot.className = 'effect-dropdown-dot cat-' + category;
      item.appendChild(dot);

      const name = document.createElement('span');
      name.textContent = preset.name;
      item.appendChild(name);

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        _closeDropdown();
        _applyPreset(preset);
      });

      dropdown.appendChild(item);
    }

    anchorBtn.style.position = 'relative';
    anchorBtn.appendChild(dropdown);
    _activeDropdown = dropdown;

    setTimeout(() => {
      document.addEventListener('click', _closeDropdown, { once: true });
    }, 0);
  }

  function _closeDropdown() {
    if (_activeDropdown) {
      _activeDropdown.remove();
      _activeDropdown = null;
    }
  }

  function _showToolbar() {
    if (!_toolbarEl) return;
    _toolbarEl.style.display = 'flex';
  }

  function _hideToolbar() {
    if (!_toolbarEl) return;
    _toolbarEl.style.display = 'none';
    _closeDropdown();
  }

  // ============ 应用预设效果 ============
  function _applyPreset(preset) {
    const selData = _selectedElementData;
    if (!selData) return;

    const selector = selData.selector;
    if (!selector) return;

    const cssCode = preset.generateCSS(selector);
    const jsCode = preset.generateJS(selector);

    const effect = EffectStore.add({
      presetId: preset.id,
      name: preset.name,
      category: preset.category,
      selector: selector,
      tagName: selData.tagName || '',
      cssCode: cssCode,
      jsCode: jsCode,
      description: preset.description
    });

    InjectManager.inject(effect);
    _renderEffectList();

    LiveFront.EventBus.emit('effect:created', effect);
    LiveFront.EventBus.emit('modification:created', {
      label: '\u6DFB\u52A0\u6548\u679C: ' + effect.name + ' \u2192 ' + selector,
      detail: effect.description,
      selector: selector,
      source: 'effect'
    });
  }

  // ============ 效果线面板渲染 ============
  let _panelContainer = null;

  function _initPanel() {
    const check = setInterval(() => {
      const workspace = document.getElementById('workspace');
      if (workspace) {
        clearInterval(check);
        _injectPanelUI();
      }
    }, 300);
  }

  function _injectPanelUI() {
    const container = document.createElement('div');
    container.className = 'effectline-container';
    container.id = 'effectlineContainer';

    container.innerHTML =
      '<div class="effectline-header">' +
        '<div class="effectline-header-left">' +
          '<span class="effectline-title">\u6548\u679C\u7EBF</span>' +
          '<span class="effectline-count" id="effectlineCount">0 \u4E2A\u6548\u679C</span>' +
        '</div>' +
        '<div class="effectline-header-right">' +
          '<button class="effectline-btn" id="effectlineExportBtn">\u5BFC\u51FA\u4EE3\u7801</button>' +
        '</div>' +
      '</div>' +
      '<div class="effectline-list" id="effectlineList"></div>';

    const workspace = document.getElementById('workspace');
    if (workspace) {
      workspace.appendChild(container);
    }

    document.getElementById('effectlineExportBtn')?.addEventListener('click', () => _exportCode());
    _panelContainer = document.getElementById('effectlineList');
    _renderEffectList();
  }

  function _renderEffectList() {
    if (!_panelContainer) return;

    const effects = EffectStore.getAll();
    const countEl = document.getElementById('effectlineCount');
    if (countEl) {
      countEl.textContent = effects.length + ' \u4E2A\u6548\u679C';
    }

    _panelContainer.innerHTML = '';

    if (effects.length === 0) {
      _panelContainer.innerHTML =
        '<div class="effectline-empty">' +
          '\u5728\u9884\u89C8\u533A\u9009\u4E2D\u5143\u7D20\u540E\uFF0C\u901A\u8FC7\u5FEB\u6377\u5DE5\u5177\u680F\u6DFB\u52A0\u6548\u679C' +
        '</div>';
      return;
    }

    for (const eff of effects) {
      const card = _createEffectCard(eff);
      _panelContainer.appendChild(card);
    }
  }

  function _createEffectCard(effect) {
    const card = document.createElement('div');
    card.className = 'effect-card' + (effect.enabled ? '' : ' effect-disabled');
    card.dataset.effectId = effect.id;

    const dot = document.createElement('span');
    dot.className = 'effect-card-dot cat-' + effect.category;
    card.appendChild(dot);

    const body = document.createElement('div');
    body.className = 'effect-card-body';

    const row1 = document.createElement('div');
    row1.className = 'effect-card-row1';

    const catLabel = document.createElement('span');
    catLabel.className = 'effect-card-cat-label cat-' + effect.category;
    catLabel.textContent = CAT_LABELS[effect.category] || effect.category;
    row1.appendChild(catLabel);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'effect-card-name';
    nameSpan.textContent = effect.name;
    row1.appendChild(nameSpan);
    body.appendChild(row1);

    const selDiv = document.createElement('div');
    selDiv.className = 'effect-card-selector';
    selDiv.textContent = effect.selector;
    body.appendChild(selDiv);

    card.appendChild(body);

    const toggle = document.createElement('div');
    toggle.className = 'effect-toggle' + (effect.enabled ? ' active' : '');
    toggle.addEventListener('click', () => {
      const toggled = EffectStore.toggle(effect.id);
      if (toggled) {
        if (toggled.enabled) {
          InjectManager.inject(toggled);
        } else {
          InjectManager.remove(toggled.id);
        }
        _renderEffectList();
        LiveFront.EventBus.emit('effect:toggled', toggled);
      }
    });
    card.appendChild(toggle);

    const actions = document.createElement('div');
    actions.className = 'effect-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'effect-card-action';
    editBtn.textContent = '\u7F16\u8F91';
    editBtn.addEventListener('click', () => _editEffect(effect));
    actions.appendChild(editBtn);

    const disableBtn = document.createElement('button');
    disableBtn.className = 'effect-card-action';
    disableBtn.textContent = effect.enabled ? '\u7981\u7528' : '\u542F\u7528';
    disableBtn.addEventListener('click', () => {
      const toggled = EffectStore.toggle(effect.id);
      if (toggled) {
        if (toggled.enabled) {
          InjectManager.inject(toggled);
        } else {
          InjectManager.remove(toggled.id);
        }
        _renderEffectList();
        LiveFront.EventBus.emit('effect:toggled', toggled);
      }
    });
    actions.appendChild(disableBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'effect-card-action action-delete';
    delBtn.textContent = '\u5220\u9664';
    delBtn.addEventListener('click', () => {
      const removed = EffectStore.remove(effect.id);
      if (removed) {
        InjectManager.remove(effect.id);
        _renderEffectList();
        LiveFront.EventBus.emit('effect:deleted', removed);
      }
    });
    actions.appendChild(delBtn);
    card.appendChild(actions);

    card.addEventListener('mouseenter', () => _highlightElement(effect.selector, true));
    card.addEventListener('mouseleave', () => _highlightElement(effect.selector, false));

    return card;
  }

  // ============ 预览区高亮 ============
  function _highlightElement(selector, show) {
    const wv = LiveFront.Preview?.getWebview();
    if (!wv) return;
    var code = '(function(){\n';
    code += '  var el = document.querySelector(' + JSON.stringify(selector) + ');\n';
    code += '  if (!el) return;\n';
    if (show) {
      code += '  el.style.outline = "2px solid #4a6cf7";\n';
      code += '  el.style.outlineOffset = "2px";\n';
    } else {
      code += '  el.style.outline = "";\n';
      code += '  el.style.outlineOffset = "";\n';
    }
    code += '})();';
    wv.executeJavaScript(code).catch(() => {});
  }

  // ============ 编辑效果 ============
  function _editEffect(effect) {
    const overlay = document.createElement('div');
    overlay.className = 'effect-edit-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'effect-edit-dialog';

    dialog.innerHTML =
      '<h3>\u7F16\u8F91\u6548\u679C: ' + _escHtml(effect.name) + '</h3>' +
      '<label>\u76EE\u6807\u9009\u62E9\u5668</label>' +
      '<input type="text" id="_effEditSelector" value="' + _escHtml(effect.selector) + '" readonly />' +
      '<label>\u6548\u679C\u540D\u79F0</label>' +
      '<input type="text" id="_effEditName" value="' + _escHtml(effect.name) + '" />' +
      '<label>CSS \u4EE3\u7801\u9884\u89C8</label>' +
      '<div class="effect-edit-preview" id="_effEditCSS">' + _escHtml(effect.cssCode) + '</div>' +
      '<div class="effect-edit-actions">' +
        '<button class="btn btn-ghost" id="_effEditCancel">\u53D6\u6D88</button>' +
        '<button class="btn btn-primary" id="_effEditSave">\u4FDD\u5B58</button>' +
      '</div>';

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.querySelector('#_effEditCancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#_effEditSave').addEventListener('click', () => {
      const newName = overlay.querySelector('#_effEditName').value.trim();
      if (newName) {
        EffectStore.update(effect.id, { name: newName });
        const updated = EffectStore.get(effect.id);
        if (updated && updated.enabled) {
          InjectManager.inject(updated);
        }
        _renderEffectList();
        LiveFront.EventBus.emit('effect:updated', updated);
      }
      overlay.remove();
    });
  }

  // ============ 导出代码 ============
  function _exportCode() {
    const enabled = EffectStore.getEnabled();
    if (enabled.length === 0) {
      _showToast('\u6CA1\u6709\u542F\u7528\u7684\u6548\u679C\u53EF\u4EE5\u5BFC\u51FA');
      return;
    }

    const cssParts = enabled.map(e => '/* ' + e.name + ' \u2014 ' + e.selector + ' */\n' + e.cssCode);
    const cssContent = '/* LiveFront \u6548\u679C\u7EBF \u2014 \u81EA\u52A8\u751F\u6210 */\n\n' + cssParts.join('\n\n');

    const jsParts = enabled.filter(e => e.jsCode).map(e => '// ' + e.name + ' \u2014 ' + e.selector + '\n' + e.jsCode);
    const jsContent = jsParts.length > 0
      ? '// LiveFront \u6548\u679C\u7EBF \u2014 \u81EA\u52A8\u751F\u6210\n\n' + jsParts.join('\n\n')
      : '';

    const projectPath = LiveFront.state.currentProjectPath;
    if (!projectPath) {
      _showToast('\u8BF7\u5148\u6253\u5F00\u9879\u76EE');
      return;
    }

    const fs = LiveFront.Services.fileSystem;
    const sep = projectPath.includes('/') ? '/' : '\\';
    const cssPath = projectPath + sep + 'livefront-effects.css';
    const jsPath = projectPath + sep + 'livefront-effects.js';

    fs.writeFile(cssPath, cssContent).then(() => {
      _showToast('\u5DF2\u5BFC\u51FA livefront-effects.css');
    }).catch(err => {
      console.error('[EffectLine] export CSS failed:', err);
      _showToast('\u5BFC\u51FA CSS \u5931\u8D25');
    });

    if (jsContent) {
      fs.writeFile(jsPath, jsContent).then(() => {
        _showToast('\u5DF2\u5BFC\u51FA livefront-effects.js');
      }).catch(err => {
        console.error('[EffectLine] export JS failed:', err);
        _showToast('\u5BFC\u51FA JS \u5931\u8D25');
      });
    }

    _addFileReferences(projectPath, cssPath, jsPath, jsContent);
  }

  function _addFileReferences(projectPath, cssPath, jsPath, hasJS) {
    const fs = LiveFront.Services.fileSystem;
    const sep = projectPath.includes('/') ? '/' : '\\';
    const htmlPath = projectPath + sep + 'index.html';

    fs.readFile(htmlPath).then(content => {
      if (!content) return;

      let modified = false;
      const cssRel = 'livefront-effects.css';
      const jsRel = 'livefront-effects.js';

      if (!content.includes(cssRel)) {
        if (content.includes('</head>')) {
          content = content.replace('</head>', '  <link rel="stylesheet" href="' + cssRel + '">\n</head>');
          modified = true;
        }
      }

      if (hasJS && !content.includes(jsRel)) {
        if (content.includes('</body>')) {
          content = content.replace('</body>', '  <script src="' + jsRel + '"><\/script>\n</body>');
          modified = true;
        }
      }

      if (modified) {
        fs.writeFile(htmlPath, content).then(() => {
          _showToast('\u5DF2\u5728 index.html \u4E2D\u6DFB\u52A0\u5F15\u7528');
        });
      }
    }).catch(() => {});
  }

  // ============ Toast 提示 ============
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

  // ============ 工具函数 ============
  function _escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ============ 暴露 API ============
  window.LiveFront.EffectLine = {
    EffectStore: EffectStore,
    InjectManager: InjectManager,
    initToolbar: _createToolbar,
    renderEffectList: _renderEffectList,
    showToolbar: _showToolbar,
    hideToolbar: _hideToolbar,
    setSelectedElement: function(data) { _selectedElementData = data; },
    getSelectedElement: function() { return _selectedElementData; },
    initPanel: _initPanel,
    exportCode: _exportCode
  };
})();
