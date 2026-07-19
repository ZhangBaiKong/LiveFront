/**
 * LiveFront v2.0 – 文件树模块
 *
 * 职责：
 *   - 打开文件夹对话框
 *   - 递归渲染目录结构
 *   - 文件图标映射
 *   - 单击文件：发射 filetree:file-selected 事件
 *   - 右键文件：弹出上下文菜单（新建文件、重命名、删除）
 */

/** @type {object} 应用上下文（init 时注入） */
let ctx = null;

/** 当前项目路径 */
let currentProjectPath = null;

/** 展开的目录集合 */
const expandedDirs = new Set();

/** 文件图标映射 */
const FILE_ICONS = {
  folder: "\ud83d\udcc1",
  html: "\ud83d\udd36",
  htm: "\ud83d\udd36",
  css: "\ud83d\udd37",
  scss: "\ud83d\udd37",
  less: "\ud83d\udd37",
  js: "\ud83d\udfe1",
  mjs: "\ud83d\udfe1",
  ts: "\ud83d\udfe1",
  jsx: "\ud83d\udfe1",
  tsx: "\ud83d\udfe1",
  json: "\ud83d\udfe2",
  png: "\ud83d\uddbc\ufe0f",
  jpg: "\ud83d\uddbc\ufe0f",
  jpeg: "\ud83d\uddbc\ufe0f",
  gif: "\ud83d\uddbc\ufe0f",
  svg: "\ud83d\uddbc\ufe0f",
  webp: "\ud83d\uddbc\ufe0f",
  ico: "\ud83d\uddbc\ufe0f",
  md: "\ud83d\udcc4",
  txt: "\ud83d\udcc4",
  vue: "\ud83d\udfe2",
  py: "\ud83d\udfe2",
  rb: "\ud83d\udfe2",
  go: "\ud83d\udfe2",
  rs: "\ud83d\udfe2",
  yml: "\u2699\ufe0f",
  yaml: "\u2699\ufe0f",
  toml: "\u2699\ufe0f",
  xml: "\u2699\ufe0f",
  gitignore: "\ud83d\udc19",
};

/**
 * 获取文件图标
 * @param {object} entry - 文件/目录对象
 * @returns {string}
 */
function getFileIcon(entry) {
  if (entry.isDirectory) return FILE_ICONS.folder;
  const ext = entry.extension?.replace(".", "") || "";
  return FILE_ICONS[ext] || "\ud83d\udcc4";
}

/**
 * 渲染单个文件/目录节点
 * @param {object} entry - 文件/目录对象
 * @param {number} depth - 缩进层级
 * @returns {string} HTML 字符串
 */
function renderNode(entry, depth) {
  const indent = depth * 16;
  const icon = getFileIcon(entry);
  const isDir = entry.isDirectory;
  const isExpanded = expandedDirs.has(entry.path);

  if (isDir) {
    return `
      <div class="ft-item ft-dir" data-path="${escapeHtml(entry.path)}" data-type="dir" style="padding-left:${indent}px">
        <span class="ft-icon ft-dir-icon ${isExpanded ? "expanded" : ""}">${isExpanded ? "\u25bc" : "\u25b6"}</span>
        <span class="ft-icon">${icon}</span>
        <span class="ft-name">${escapeHtml(entry.name)}</span>
      </div>
      <div class="ft-children" data-parent="${escapeHtml(entry.path)}" style="display:${isExpanded ? "block" : "none"}">
      </div>`;
  }

  const ext = entry.extension?.replace(".", "") || "";
  return `
    <div class="ft-item ft-file" data-path="${escapeHtml(entry.path)}" data-type="file" data-ext="${ext}" style="padding-left:${indent + 16}px">
      <span class="ft-icon">${icon}</span>
      <span class="ft-name">${escapeHtml(entry.name)}</span>
    </div>`;
}

/**
 * 渲染目录的子项（懒加载）
 * @param {string} dirPath - 目录路径
 * @param {HTMLElement} container - 容器元素
 * @param {number} depth - 缩进层级
 */
async function renderChildren(dirPath, container, depth) {
  try {
    const entries = await ctx.ipc.fs.readDir(dirPath);
    if (!entries || entries.length === 0) {
      container.innerHTML = `<div class="ft-item ft-empty" style="padding-left:${(depth + 1) * 16 + 16}px">
        <span class="ft-name" style="color:var(--color-text-tertiary);font-style:italic">空文件夹</span>
      </div>`;
      return;
    }
    container.innerHTML = entries.map((e) => renderNode(e, depth + 1)).join("");
  } catch (err) {
    console.error("[FileTree] 渲染子目录失败:", err);
  }
}

/**
 * 递归渲染整个文件树
 * @param {string} rootPath - 项目根路径
 */
async function renderTree(rootPath) {
  const container = document.getElementById("filetree-container");
  if (!container) return;

  // 清空展开状态
  expandedDirs.clear();
  expandedDirs.add(rootPath);

  try {
    const entries = await ctx.ipc.fs.readDir(rootPath);
    if (!entries || entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">\ud83d\udcc2</span>
          <span class="empty-state-text">空项目</span>
        </div>`;
      return;
    }

    container.innerHTML = entries.map((e) => renderNode(e, 0)).join("");

    // 自动展开根目录的子项
    const rootChildren = container.querySelector(`.ft-children[data-parent="${CSS.escape(rootPath)}"]`);
    if (rootChildren) {
      await renderChildren(rootPath, rootChildren, 0);
    }
  } catch (err) {
    console.error("[FileTree] 渲染文件树失败:", err);
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">\u26a0\ufe0f</span>
        <span class="empty-state-text">无法读取项目</span>
      </div>`;
  }
}

/**
 * 打开文件夹对话框
 */
async function openFolder() {
  const folderPath = await ctx.ipc.fs.openFolder();
  if (!folderPath) return;

  currentProjectPath = folderPath;
  const folderName = folderPath.split(/[\\/]/).pop();

  // 更新状态
  ctx.services.setState("project.path", folderPath);
  ctx.services.setState("project.name", folderName);
  ctx.services.setState("project.isOpen", true);

  // 更新状态栏
  const statusDot = document.querySelector(".status-dot");
  if (statusDot) statusDot.classList.add("connected");
  ctx.services.updateStatus(`已打开: ${folderName}`);

  // 渲染文件树
  await renderTree(folderPath);

  // 发射文件夹打开事件
  ctx.eventBus.emit("filetree:folder-opened", { path: folderPath, name: folderName });
}

/**
 * 处理文件点击
 * @param {HTMLElement} item - 点击的文件项
 */
function handleFileClick(item) {
  const filePath = item.dataset.path;
  const ext = item.dataset.ext;

  // 高亮选中
  document.querySelectorAll(".ft-item.selected").forEach((el) => el.classList.remove("selected"));
  item.classList.add("selected");

  // 发射文件选中事件
  ctx.eventBus.emit("filetree:file-selected", { path: filePath, extension: ext });
}

/**
 * 处理目录点击（展开/折叠）
 * @param {HTMLElement} item - 点击的目录项
 */
async function handleDirClick(item) {
  const dirPath = item.dataset.path;
  const childrenEl = item.nextElementSibling;
  const iconEl = item.querySelector(".ft-dir-icon");

  if (expandedDirs.has(dirPath)) {
    // 折叠
    expandedDirs.delete(dirPath);
    childrenEl.style.display = "none";
    iconEl.classList.remove("expanded");
    iconEl.textContent = "\u25b6";
  } else {
    // 展开
    expandedDirs.add(dirPath);
    childrenEl.style.display = "block";
    iconEl.classList.add("expanded");
    iconEl.textContent = "\u25bc";

    // 懒加载子目录
    if (childrenEl.children.length === 0) {
      const depth = Math.round((parseInt(item.style.paddingLeft) || 0) / 16);
      await renderChildren(dirPath, childrenEl, depth);
    }
  }
}

/**
 * 显示上下文菜单
 * @param {number} x - 鼠标 X 坐标
 * @param {number} y - 鼠标 Y 坐标
 * @param {HTMLElement} item - 右键点击的元素
 */
function showContextMenu(x, y, item) {
  // 移除已有菜单
  hideContextMenu();

  const isDir = item.dataset.type === "dir";
  const filePath = item.dataset.path;
  const dirPath = isDir ? filePath : filePath.replace(/[\\/][^\\/]+$/, "");
  const fileName = item.dataset.path.split(/[\\/]/).pop();

  const menu = document.createElement("div");
  menu.className = "ft-context-menu";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const items = [
    { label: "\ud83d\uddc2\ufe0f 新建文件", action: () => createNewFile(dirPath) },
  ];

  if (isDir) {
    items.push({ label: "\ud83d\uddc1\ufe0f 新建文件夹", action: () => createNewFolder(dirPath) });
  }

  items.push(
    { label: "\u270f\ufe0f 重命名", action: () => renameItem(filePath, fileName) },
    { type: "separator" },
    { label: "\ud83d\uddd1\ufe0f 删除", action: () => deleteItem(filePath), danger: true }
  );

  items.forEach((menuItem) => {
    if (menuItem.type === "separator") {
      const sep = document.createElement("div");
      sep.className = "ft-context-separator";
      menu.appendChild(sep);
    } else {
      const el = document.createElement("div");
      el.className = `ft-context-item${menuItem.danger ? " danger" : ""}`;
      el.textContent = menuItem.label;
      el.addEventListener("click", () => {
        hideContextMenu();
        menuItem.action();
      });
      menu.appendChild(el);
    }
  });

  document.body.appendChild(menu);

  // 确保菜单不超出视口
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${x - rect.width}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${y - rect.height}px`;
  }
}

/**
 * 隐藏上下文菜单
 */
function hideContextMenu() {
  const existing = document.querySelector(".ft-context-menu");
  if (existing) existing.remove();
}

/**
 * 新建文件
 * @param {string} dirPath - 目标目录
 */
async function createNewFile(dirPath) {
  const name = prompt("输入文件名:");
  if (!name) return;

  const result = await ctx.ipc.fs.createFile(dirPath, name);
  if (result) {
    ctx.services.toast(`已创建: ${name}`, "success");
    // 刷新目录
    refreshParentDir(dirPath);
  } else {
    ctx.services.toast("创建文件失败", "error");
  }
}

/**
 * 新建文件夹
 * @param {string} dirPath - 目标目录
 */
async function createNewFolder(dirPath) {
  const name = prompt("输入文件夹名:");
  if (!name) return;

  const folderPath = dirPath + "/" + name;
  try {
    // 使用 writeFile 创建空文件再删除的方式来创建文件夹（通过 IPC 不方便 mkdir）
    // 改为通过 IPC 调用创建文件夹
    const result = await ctx.ipc.invoke("fs:createFile", dirPath, name + "/.keep");
    if (result) {
      ctx.services.toast(`已创建文件夹: ${name}`, "success");
      refreshParentDir(dirPath);
    }
  } catch (err) {
    ctx.services.toast("创建文件夹失败", "error");
  }
}

/**
 * 重命名
 * @param {string} oldPath - 原路径
 * @param {string} oldName - 原名称
 */
async function renameItem(oldPath, oldName) {
  const newName = prompt("输入新名称:", oldName);
  if (!newName || newName === oldName) return;

  const dir = oldPath.replace(/[\\/][^\\/]+$/, "");
  const newPath = dir + "/" + newName;

  const result = await ctx.ipc.fs.rename(oldPath, newPath);
  if (result) {
    ctx.services.toast(`已重命名为: ${newName}`, "success");
    if (currentProjectPath) renderTree(currentProjectPath);
  } else {
    ctx.services.toast("重命名失败", "error");
  }
}

/**
 * 删除文件/文件夹
 * @param {string} filePath - 要删除的路径
 */
async function deleteItem(filePath) {
  const name = filePath.split(/[\\/]/).pop();
  if (!confirm(`确定要删除 "${name}" 吗？`)) return;

  const result = await ctx.ipc.fs.delete(filePath);
  if (result) {
    ctx.services.toast(`已删除: ${name}`, "success");
    if (currentProjectPath) renderTree(currentProjectPath);
  } else {
    ctx.services.toast("删除失败", "error");
  }
}

/**
 * 刷新指定目录的子项显示
 * @param {string} dirPath - 目录路径
 */
async function refreshParentDir(dirPath) {
  const container = document.querySelector(`.ft-children[data-parent="${CSS.escape(dirPath)}"]`);
  if (container) {
    const depth = expandedDirs.has(dirPath)
      ? Math.round((parseInt(container.previousElementSibling?.style.paddingLeft) || 0) / 16)
      : 0;
    await renderChildren(dirPath, container, depth);
  } else if (currentProjectPath) {
    await renderTree(currentProjectPath);
  }
}

/**
 * HTML 转义
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * 绑定文件树交互事件
 */
function bindEvents() {
  const container = document.getElementById("filetree-container");
  if (!container) return;

  // 单击：文件选中 / 目录展开折叠
  container.addEventListener("click", (e) => {
    const item = e.target.closest(".ft-item");
    if (!item) return;

    if (item.dataset.type === "dir") {
      handleDirClick(item);
    } else {
      handleFileClick(item);
    }
  });

  // 右键：上下文菜单
  container.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const item = e.target.closest(".ft-item");
    if (!item) return;
    showContextMenu(e.clientX, e.clientY, item);
  });

  // 点击空白处隐藏菜单
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".ft-context-menu")) {
      hideContextMenu();
    }
  });

  // 监听菜单栏"打开文件夹"
  ctx.ipc.on("menu:openFolder", () => {
    openFolder();
  });
}

/**
 * 模块 manifest
 */
const manifest = {
  id: "filetree",
  dependencies: [],
  commands: ["filetree.openFolder"],
  menus: [
    {
      path: "文件",
      items: [
        { label: "打开文件夹", command: "filetree.openFolder", shortcut: "CmdOrCtrl+O" },
      ],
    },
  ],

  /**
   * 模块初始化
   * @param {object} context - 应用上下文
   */
  init(context) {
    ctx = context;
    console.log("[FileTree] 模块初始化");

    // 绑定事件
    bindEvents();

    // 注册命令
    ctx.commands?.register("filetree.openFolder", openFolder);

    // 监听刷新按钮
    const refreshBtn = document.querySelector(".file-tree .panel-btn[title='\u21bb']");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        if (currentProjectPath) renderTree(currentProjectPath);
      });
    }
  },

  /** 打开文件夹（供外部调用） */
  openFolder,
  /** 渲染文件树（供外部调用） */
  renderTree,
  /** 获取当前项目路径 */
  getProjectPath: () => currentProjectPath,
};

// 注册模块
if (typeof window !== "undefined" && window.LiveFront?.modules) {
  window.LiveFront.modules.register(manifest);
}

export default manifest;
