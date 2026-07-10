/* LiveFront 文件树模块 — 拼图验证 */
(function () {
  LiveFront.modules.register({
    id: 'filetree',
    name: '文件树',
    version: '0.1.0',
    description: '项目文件树浏览器',

    dependencies: [],
    optionalDependencies: [],

    ui: {
      sidebar: {
        enabled: true,
        icon: '📁',
        label: '文件',
        panel: null
      },
      statusbar: [
        { id: 'filetree-status', position: 'left', text: '未打开项目', tooltip: '文件树状态' }
      ]
    },

    commands: [
      { id: 'filetree.open', label: '打开文件夹', category: '文件', handler: null },
      { id: 'filetree.refresh', label: '刷新文件树', category: '文件', handler: null },
      { id: 'filetree.collapseAll', label: '折叠所有', category: '文件', handler: null },
      { id: 'filetree.expandAll', label: '展开所有', category: '文件', handler: null }
    ],

    shortcuts: [
      { key: 'Ctrl+O', command: 'filetree.open' }
    ],

    menus: [
      {
        menuPath: '文件',
        items: [
          { label: '打开文件夹...', command: 'filetree.open', shortcut: 'Ctrl+O' },
          { separator: true },
          { label: '刷新文件树', command: 'filetree.refresh' },
          { separator: true },
          { label: '折叠所有', command: 'filetree.collapseAll' },
          { label: '展开所有', command: 'filetree.expandAll' }
        ]
      }
    ],

    contextMenus: [
      {
        target: 'filetree',
        items: [
          { label: '新建文件', command: 'filetree.createFile' },
          { label: '新建文件夹', command: 'filetree.createDir' },
          { separator: true },
          { label: '重命名', command: 'filetree.rename' },
          { label: '删除', command: 'filetree.delete' }
        ]
      }
    ],

    events: {
      emits: [
        { name: 'file:opened', payload: '{ path, name }' }
      ],
      listens: []
    },

    state: {
      projectPath: null,
      tree: null,
      selectedPath: null,
      expandedDirs: new Set()
    },

    async init(ctx) {
      this._ctx = ctx;

      // 注册命令处理器
      ctx.commands.register('filetree.open', () => this._openFolder());
      ctx.commands.register('filetree.refresh', () => this._refresh());
      ctx.commands.register('filetree.collapseAll', () => this._collapseAll());
      ctx.commands.register('filetree.expandAll', () => this._expandAll());

      // 监听打开项目事件
      ctx.eventBus.on('project:open', (projectPath) => this._loadProject(projectPath));

      // 渲染侧边栏内容
      this._renderSidebar();
    },

    // ── 文件图标映射 ──
    _getFileIcon(name, type) {
      if (type === 'directory') return '📁';
      const ext = name.split('.').pop().toLowerCase();
      const iconMap = {
        'html': '🌐', 'htm': '🌐',
        'css': '🎨', 'scss': '🎨', 'less': '🎨',
        'js': '📜', 'mjs': '📜', 'cjs': '📜',
        'ts': '📘', 'tsx': '📘',
        'jsx': '⚛️',
        'json': '📋',
        'md': '📝', 'txt': '📝',
        'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'svg': '🖼️', 'webp': '🖼️', 'ico': '🖼️',
        'mp4': '🎬', 'webm': '🎬', 'mp3': '🎵', 'wav': '🎵',
        'zip': '📦', 'tar': '📦', 'gz': '📦',
        'pdf': '📄',
        'gitignore': '🔧', 'env': '🔧',
        'yml': '⚙️', 'yaml': '⚙️', 'toml': '⚙️',
      };
      return iconMap[ext] || '📄';
    },

    async _openFolder() {
      const folderPath = await this._ctx.services.dialog.openFolder();
      if (!folderPath) return;
      await this._loadProject(folderPath);
      this._ctx.storage.set('lastProjectPath', folderPath);
    },

    async _loadProject(projectPath) {
      this.state.projectPath = projectPath;
      this.state.tree = await this._ctx.services.fileSystem.readDir(projectPath);
      // 默认展开第一级
      this.state.expandedDirs.clear();
      this.state.expandedDirs.add(projectPath);
      this._renderTree();
      this._ctx.layout.showWorkspace();
      this._ctx.eventBus.emit('project:opened', { path: projectPath, tree: this.state.tree });
      // 更新状态栏
      const statusEl = document.getElementById('filetree-status');
      if (statusEl) statusEl.textContent = projectPath.split(/[/\\]/).pop();
    },

    async _refresh() {
      if (!this.state.projectPath) return;
      this.state.tree = await this._ctx.services.fileSystem.readDir(this.state.projectPath);
      this._renderTree();
    },

    _collapseAll() {
      this.state.expandedDirs.clear();
      this._renderTree();
    },

    _expandAll() {
      if (!this.state.tree) return;
      this._expandNodes(this.state.tree);
      this._renderTree();
    },

    _expandNodes(nodes) {
      for (const node of nodes) {
        if (node.type === 'directory') {
          this.state.expandedDirs.add(node.path);
          if (node.children) this._expandNodes(node.children);
        }
      }
    },

    _renderSidebar() {
      const container = document.getElementById('sidebarContent');
      if (!container) return;
      container.innerHTML = '';
      // 侧边栏头部
      const header = LiveFront.DOM.el('div', { class: 'filetree-header' });
      header.style.cssText = 'padding:10px 12px;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;display:flex;align-items:center;justify-content:space-between;';
      header.appendChild(LiveFront.DOM.el('span', {}, '文件'));
      // 工具栏按钮
      const actions = LiveFront.DOM.el('div', { class: 'filetree-actions' });
      actions.style.cssText = 'display:flex;gap:4px;';
      const btnRefresh = LiveFront.DOM.el('button', { title: '刷新' }, '↻');
      btnRefresh.style.cssText = 'font-size:14px;padding:2px 4px;border-radius:3px;color:var(--text-muted);';
      btnRefresh.addEventListener('click', () => this._refresh());
      btnRefresh.addEventListener('mouseenter', () => btnRefresh.style.background = 'var(--bg-hover)');
      btnRefresh.addEventListener('mouseleave', () => btnRefresh.style.background = '');
      actions.appendChild(btnRefresh);
      header.appendChild(actions);
      container.appendChild(header);
      // 树容器
      container.appendChild(LiveFront.DOM.el('div', { id: 'filetreeTree' }));
    },

    _renderTree() {
      const treeContainer = document.getElementById('filetreeTree');
      if (!treeContainer) return;
      treeContainer.innerHTML = '';
      if (!this.state.tree || this.state.tree.length === 0) {
        treeContainer.innerHTML = '<div style="padding:20px 12px;color:var(--text-muted);font-size:12px;text-align:center;">空目录</div>';
        return;
      }
      this._renderNodes(this.state.tree, treeContainer, 0);
    },

    _renderNodes(nodes, container, depth) {
      for (const node of nodes) {
        const row = document.createElement('div');
        row.className = 'filetree-node';
        row.dataset.path = node.path;
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 12px;padding-left:' + (12 + depth * 16) + 'px;cursor:pointer;font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;user-select:none;min-height:24px;transition:background 80ms ease;';

        // 选中状态
        if (this.state.selectedPath === node.path) {
          row.style.background = 'var(--bg-active)';
          row.style.color = 'var(--text-primary)';
        }

        // 折叠/展开箭头（仅目录）
        const isDir = node.type === 'directory';
        const isExpanded = isDir && this.state.expandedDirs.has(node.path);
        if (isDir) {
          const arrow = document.createElement('span');
          arrow.style.cssText = 'font-size:10px;width:14px;text-align:center;color:var(--text-muted);flex-shrink:0;transition:transform 120ms ease;';
          arrow.textContent = isExpanded ? '▼' : '▶';
          if (isExpanded) arrow.style.transform = 'rotate(0deg)';
          row.appendChild(arrow);
        } else {
          const spacer = document.createElement('span');
          spacer.style.cssText = 'width:14px;flex-shrink:0;';
          row.appendChild(spacer);
        }

        // 文件图标
        const icon = document.createElement('span');
        icon.style.cssText = 'font-size:14px;flex-shrink:0;';
        icon.textContent = this._getFileIcon(node.name, node.type);
        row.appendChild(icon);

        // 文件名
        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'overflow:hidden;text-overflow:ellipsis;';
        nameSpan.textContent = node.name;
        row.appendChild(nameSpan);

        // 事件
        row.addEventListener('mouseenter', () => {
          if (this.state.selectedPath !== node.path) {
            row.style.background = 'var(--bg-hover)';
          }
        });
        row.addEventListener('mouseleave', () => {
          if (this.state.selectedPath !== node.path) {
            row.style.background = '';
          }
        });
        row.addEventListener('click', (e) => {
          if (isDir) {
            // 切换展开/折叠
            if (this.state.expandedDirs.has(node.path)) {
              this.state.expandedDirs.delete(node.path);
            } else {
              this.state.expandedDirs.add(node.path);
            }
            this._renderTree();
          } else {
            // 选中文件
            this._selectFile(node);
          }
        });
        row.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this._selectFile(node);
          LiveFront.ContextMenu.show('filetree', e.clientX, e.clientY);
        });

        container.appendChild(row);

        // 递归渲染子节点
        if (isDir && isExpanded && node.children) {
          this._renderNodes(node.children, container, depth + 1);
        }
      }
    },

    _selectFile(node) {
      this.state.selectedPath = node.path;
      // 更新选中视觉
      document.querySelectorAll('.filetree-node').forEach(el => {
        if (el.dataset.path === node.path) {
          el.style.background = 'var(--bg-active)';
          el.style.color = 'var(--text-primary)';
        } else {
          el.style.background = '';
          el.style.color = 'var(--text-secondary)';
        }
      });
      if (node.type === 'file') {
        this._ctx.eventBus.emit('file:opened', { path: node.path, name: node.name });
      }
      this._ctx.eventBus.emit('filetree:selected', { path: node.path, name: node.name, type: node.type });
    }
  });
})();