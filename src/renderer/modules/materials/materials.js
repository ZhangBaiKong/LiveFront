/* LiveFront 素材库 - 主界面和逻辑 */
(function () {
  window.LiveFront = window.LiveFront || {};

  let _overlay = null;
  let _currentCategory = '全部';
  let _searchQuery = '';
  let _currentView = 'grid';
  let _currentDetailId = null;

  const CATEGORIES = ['全部', '字体', '图标', '配色', '组件', '背景', '加载状态'];

  function _getData() {
    return LiveFront.MaterialsData || [];
  }

  function _filterMaterials() {
    let data = _getData();
    if (_currentCategory !== '全部') {
      data = data.filter(m => m.category === _currentCategory);
    }
    if (_searchQuery) {
      const q = _searchQuery.toLowerCase();
      data = data.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q)) ||
        m.category.includes(q) ||
        m.subcategory.includes(q)
      );
    }
    return data;
  }

  function _getPreviewColors(variables) {
    if (!variables) return [];
    const vals = Object.values(variables);
    return vals.slice(0, 6);
  }

  function _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _highlightCode(code) {
    if (!code) return '';
    let escaped = _escapeHtml(code);
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>');
    escaped = escaped.replace(/(\/\/[^\n]*)/g, '<span class="code-comment">$1</span>');
    escaped = escaped.replace(/(&lt;\/?[\w-]+)/g, '<span class="code-tag">$1</span>');
    escaped = escaped.replace(/([\w-]+)(?==)/g, '<span class="code-attr">$1</span>');
    escaped = escaped.replace(/(['"])([^'"]*)\1/g, '<span class="code-string">$1$2$1</span>');
    escaped = escaped.replace(/(var\(--[\w-]+\))/g, '<span class="code-property">$1</span>');
    escaped = escaped.replace(/(#[0-9a-fA-F]{3,8})/g, '<span class="code-value">$1</span>');
    return escaped;
  }

  function _renderCardPreview(material) {
    switch (material.previewType) {
      case 'text':
        return '<div class="materials-preview-text" style="font-family:' + (material.fontFamily || 'inherit') + '">LiveFront 预览</div>';
      case 'color-swatch': {
        const colors = _getPreviewColors(material.code.variables);
        if (colors.length === 0 && material.code.css) {
          const matches = material.code.css.match(/#[0-9a-fA-F]{3,8}/g) || [];
          const swatches = matches.slice(0, 6);
          return '<div class="materials-preview-colors">' +
            swatches.map(c => '<div class="materials-preview-color" style="background:' + c + '"></div>').join('') +
            '</div>';
        }
        return '<div class="materials-preview-colors">' +
          colors.map(c => '<div class="materials-preview-color" style="background:' + c + '"></div>').join('') +
          '</div>';
      }
      case 'code-block':
        if (material.code.html) {
          return '<div class="materials-preview-code">' + _escapeHtml(material.code.html.substring(0, 200)) + '</div>';
        }
        if (material.code.css) {
          return '<div class="materials-preview-code">' + _escapeHtml(material.code.css.substring(0, 200)) + '</div>';
        }
        return '<div class="materials-preview-code">...</div>';
      case 'image':
        return '<div style="font-size:32px">🖼️</div>';
      default:
        return '<div style="font-size:32px">📦</div>';
    }
  }

  function _renderGrid() {
    const container = document.getElementById('materialsGridContainer');
    const detail = document.getElementById('materialsDetailContainer');
    if (!container || !detail) return;

    container.style.display = 'block';
    detail.style.display = 'none';
    detail.innerHTML = '';

    const materials = _filterMaterials();
    const countEl = document.getElementById('materialsCount');
    if (countEl) countEl.textContent = materials.length + ' 个素材';

    if (materials.length === 0) {
      container.innerHTML = '<div class="materials-empty"><div class="materials-empty-icon">🔍</div><div class="materials-empty-text">没有找到匹配的素材</div></div>';
      return;
    }

    container.innerHTML = '<div class="materials-grid">' +
      materials.map(m =>
        '<div class="materials-card" data-id="' + m.id + '">' +
          '<div class="materials-card-category">' + m.category + '</div>' +
          '<div class="materials-card-preview">' + _renderCardPreview(m) + '</div>' +
          '<div class="materials-card-info">' +
            '<span class="materials-card-name">' + m.name + '</span>' +
            '<span class="materials-card-free">免费</span>' +
          '</div>' +
        '</div>'
      ).join('') +
    '</div>';

    container.querySelectorAll('.materials-card').forEach(card => {
      card.addEventListener('click', () => {
        _currentDetailId = card.dataset.id;
        _renderDetail(card.dataset.id);
      });
    });
  }

  function _renderDetailDetailPreview(material) {
    switch (material.previewType) {
      case 'text':
        return '<div class="materials-preview-text" style="font-family:' + (material.fontFamily || 'inherit') + ';font-size:42px;">LiveFront 素材库预览文字<br>Aa Bb Cc 0123456789</div>';
      case 'color-swatch': {
        const colors = _getPreviewColors(material.code.variables);
        if (colors.length === 0 && material.code.css) {
          const matches = material.code.css.match(/#[0-9a-fA-F]{3,8}/g) || [];
          const swatches = matches.slice(0, 8);
          return '<div class="materials-preview-colors" style="gap:10px">' +
            swatches.map(c => '<div class="materials-preview-color" style="width:56px;height:56px;border-radius:8px;background:' + c + '"></div>').join('') +
            '</div>';
        }
        return '<div class="materials-preview-colors" style="gap:10px">' +
          colors.map(c => '<div class="materials-preview-color" style="width:56px;height:56px;border-radius:8px;background:' + c + '"></div>').join('') +
          '</div>';
      }
      case 'code-block':
        if (material.code.html) {
          try {
            return '<div style="width:100%;min-height:200px;background:white;border-radius:8px;padding:16px;overflow:auto;">' + material.code.html + '</div>';
          } catch (e) {
            return '<div class="materials-preview-code" style="max-height:200px">' + _escapeHtml(material.code.html) + '</div>';
          }
        }
        if (material.code.css) {
          return '<div style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">背景预览</div>';
        }
        return '';
      default:
        return '';
    }
  }

  function _renderCodeBlocks(material) {
    let html = '';
    if (material.code.css) {
      html += '<div class="materials-code-section"><div class="materials-code-title">CSS 代码</div><div class="materials-code-block"><pre>' + _highlightCode(material.code.css) + '</pre></div></div>';
    }
    if (material.code.html) {
      html += '<div class="materials-code-section"><div class="materials-code-title">HTML 代码</div><div class="materials-code-block"><pre>' + _highlightCode(material.code.html) + '</pre></div></div>';
    }
    if (material.code.js) {
      html += '<div class="materials-code-section"><div class="materials-code-title">JavaScript 代码</div><div class="materials-code-block"><pre>' + _highlightCode(material.code.js) + '</pre></div></div>';
    }
    return html;
  }

  function _renderDetail(id) {
    const material = _getData().find(m => m.id === id);
    if (!material) return;

    const container = document.getElementById('materialsGridContainer');
    const detail = document.getElementById('materialsDetailContainer');
    if (!container || !detail) return;

    container.style.display = 'none';
    detail.style.display = 'block';

    const recommend = _getData().filter(m => m.category === material.category && m.id !== material.id).slice(0, 4);

    detail.innerHTML =
      '<div class="materials-detail active">' +
        '<button class="materials-detail-back" id="materialsBack">← 返回素材库</button>' +
        '<div class="materials-detail-preview">' + _renderDetailDetailPreview(material) + '</div>' +
        '<div class="materials-detail-info">' +
          '<div class="materials-detail-name">' + material.name + '</div>' +
          '<div class="materials-detail-meta">' +
            '<span>分类: ' + material.category + '</span>' +
            material.tags.map(t => '<span class="materials-detail-tag">' + t + '</span>').join('') +
          '</div>' +
          '<div class="materials-detail-desc">' + material.description + '</div>' +
        '</div>' +
        _renderCodeBlocks(material) +
        '<div class="materials-actions">' +
          '<button class="materials-btn-apply" id="materialsApply">应用到项目</button>' +
          '<button class="materials-btn-copy" id="materialsCopy">复制代码</button>' +
        '</div>' +
        (recommend.length > 0 ?
          '<div class="materials-recommend">' +
            '<div class="materials-recommend-title">同类推荐</div>' +
            '<div class="materials-recommend-grid">' +
              recommend.map(r =>
                '<div class="materials-recommend-card" data-id="' + r.id + '">' +
                  '<div class="materials-recommend-name">' + r.name + '</div>' +
                  '<div class="materials-recommend-cat">' + r.subcategory + '</div>' +
                '</div>'
              ).join('') +
            '</div>' +
          '</div>' : '') +
      '</div>';

    document.getElementById('materialsBack').addEventListener('click', () => {
      _currentDetailId = null;
      _renderGrid();
    });

    document.getElementById('materialsApply').addEventListener('click', () => {
      LiveFront.MaterialApply.applyMaterial(material);
    });

    document.getElementById('materialsCopy').addEventListener('click', () => {
      LiveFront.MaterialApply.copyCode(material);
    });

    detail.querySelectorAll('.materials-recommend-card').forEach(card => {
      card.addEventListener('click', () => {
        _currentDetailId = card.dataset.id;
        _renderDetail(card.dataset.id);
      });
    });
  }

  function _buildOverlay() {
    if (_overlay) return;

    _overlay = document.createElement('div');
    _overlay.className = 'materials-overlay';
    _overlay.id = 'materialsOverlay';
    _overlay.innerHTML =
      '<div class="materials-modal">' +
        '<div class="materials-header">' +
          '<span class="materials-title">素材库</span>' +
          '<button class="materials-close-btn" id="materialsClose">✕</button>' +
        '</div>' +
        '<div class="materials-categories" id="materialsCategories">' +
          CATEGORIES.map(c =>
            '<button class="materials-cat-btn' + (c === _currentCategory ? ' active' : '') + '" data-cat="' + c + '">' + c + '</button>'
          ).join('') +
        '</div>' +
        '<div class="materials-filter">' +
          '<div class="materials-search-box">' +
            '<span class="materials-search-icon">🔍</span>' +
            '<input class="materials-search-input" id="materialsSearch" placeholder="搜索素材...">' +
          '</div>' +
          '<span class="materials-count" id="materialsCount"></span>' +
        '</div>' +
        '<div class="materials-body">' +
          '<div id="materialsGridContainer"></div>' +
          '<div id="materialsDetailContainer"></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(_overlay);

    document.getElementById('materialsClose').addEventListener('click', closeMaterials);
    _overlay.addEventListener('click', (e) => {
      if (e.target === _overlay) closeMaterials();
    });

    document.getElementById('materialsCategories').addEventListener('click', (e) => {
      const btn = e.target.closest('.materials-cat-btn');
      if (!btn) return;
      _currentCategory = btn.dataset.cat;
      document.querySelectorAll('.materials-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _currentDetailId = null;
      _renderGrid();
    });

    const searchInput = document.getElementById('materialsSearch');
    let searchTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        _searchQuery = searchInput.value.trim();
        _currentDetailId = null;
        _renderGrid();
      }, 200);
    });
  }

  function openMaterials(searchQuery) {
    _buildOverlay();

    if (searchQuery) {
      _searchQuery = searchQuery;
      _currentCategory = '全部';
      const searchInput = document.getElementById('materialsSearch');
      if (searchInput) searchInput.value = searchQuery;
      document.querySelectorAll('.materials-cat-btn').forEach(b => b.classList.remove('active'));
      const allBtn = document.querySelector('.materials-cat-btn[data-cat="全部"]');
      if (allBtn) allBtn.classList.add('active');
    }

    _currentDetailId = null;
    _renderGrid();

    requestAnimationFrame(() => {
      _overlay.classList.add('visible');
    });
  }

  function closeMaterials() {
    if (!_overlay) return;
    _overlay.classList.remove('visible');
    setTimeout(() => {
      if (_overlay) {
        _overlay.remove();
        _overlay = null;
      }
    }, 250);
  }

  LiveFront.Materials = {
    open: openMaterials,
    close: closeMaterials,
    search: function (query) {
      openMaterials(query);
    }
  };
})();