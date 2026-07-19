/**
 * LiveFront v2.0 – 渲染进程入口
 *
 * 职责：
 *   1. 初始化全局事件总线
 *   2. 初始化共享服务（IPC 客户端、状态管理）
 *   3. 按依赖顺序加载并注册模块
 *   4. 触发应用 ready 生命周期
 */

import { EventBus } from "./core/event-bus.js";
import { IpcClient } from "./core/ipc-client.js";
import { SharedServices } from "./core/shared-services.js";

// 导入模块
import filetreeModule from "./modules/filetree/index.js";
import previewModule from "./modules/preview/index.js";

/**
 * 全局应用对象
 * 挂载在 window.__app__ 上，供各模块访问
 */
const app = {
  /** 全局事件总线 */
  eventBus: new EventBus(),
  /** IPC 通信客户端 */
  ipc: new IpcClient(),
  /** 共享服务层 */
  services: null,
  /** 已注册的模块列表 */
  modules: [],
  /** 模块注册表 */
  moduleRegistry: new Map(),
  /** 简单的命令注册系统 */
  commands: {
    _handlers: new Map(),
    register(name, handler) {
      this._handlers.set(name, handler);
    },
    execute(name, ...args) {
      const handler = this._handlers.get(name);
      if (handler) return handler(...args);
      console.warn(`[Commands] 未找到命令: ${name}`);
    },
  },
  /** 应用是否已就绪 */
  ready: false,
};

/**
 * 模块注册系统
 * 提供 LiveFront.modules.register() 给模块调用
 */
app.modules = {
  register(manifest) {
    app.moduleRegistry.set(manifest.id, manifest);
    console.log(`[LiveFront] 模块已注册: ${manifest.id}`);
  },
};

// 暴露到 window.LiveFront.modules（供模块自注册）
if (window.LiveFront) {
  window.LiveFront.modules = app.modules;
}

/**
 * 初始化应用
 * 按照依赖顺序依次初始化各核心服务
 */
async function initApp() {
  console.log("[LiveFront] 渲染进程初始化…");

  // 1. 初始化共享服务
  app.services = new SharedServices(app.eventBus, app.ipc);

  // 2. 暴露全局引用（开发调试用，生产环境可移除）
  window.__app__ = app;
  window.LiveFront.modules = app.modules;

  // 3. 绑定顶层 UI 事件
  bindGlobalUI();

  // 4. 获取应用信息并更新状态栏
  await updateAppInfo();

  // 5. 初始化模块
  initModules();

  // 6. 绑定模块间事件
  bindModuleEvents();

  // 7. 初始化欢迎页
  initWelcomePage();

  // 8. 标记就绪
  app.ready = true;
  app.eventBus.emit("app:ready");
  console.log("[LiveFront] 应用就绪 ✅");
}

/**
 * 初始化所有注册的模块
 */
function initModules() {
  const context = {
    eventBus: app.eventBus,
    ipc: app.ipc,
    services: app.services,
    commands: app.commands,
  };

  // 初始化文件树模块
  try {
    filetreeModule.init(context);
    app.modules.register(filetreeModule);
  } catch (err) {
    console.error("[LiveFront] 文件树模块初始化失败:", err);
  }

  // 初始化预览模块
  try {
    previewModule.init(context);
    app.modules.register(previewModule);
  } catch (err) {
    console.error("[LiveFront] 预览模块初始化失败:", err);
  }
}

/**
 * 绑定模块间事件
 * 实现文件树和预览区的联动
 */
function bindModuleEvents() {
  // 从最近项目打开文件夹（按路径直接打开）
  app.eventBus.on("filetree:open-project", async ({ path: projectPath }) => {
    const folderName = projectPath.split(/[\\\/]/).pop();
    app.services.setState("project.path", projectPath);
    app.services.setState("project.name", folderName);
    app.services.setState("project.isOpen", true);
    filetreeModule.renderTree(projectPath);
    app.eventBus.emit("filetree:folder-opened", { path: projectPath, name: folderName });
  });

  // 当文件夹被打开时，启动预览并保存最近项目
  app.eventBus.on("filetree:folder-opened", async ({ path: projectPath, name }) => {
    console.log(`[LiveFront] 项目已打开: ${name} (${projectPath})`);

    // 保存到最近项目
    saveRecentProject(projectPath, name);

    // 更新状态栏
    const statusProject = document.getElementById("status-project");
    if (statusProject) statusProject.textContent = name;

    // 更新状态指示灯
    const statusDot = document.querySelector(".status-dot");
    if (statusDot) statusDot.classList.add("connected");

    // 启动预览
    await previewModule.startPreview(projectPath);
  });

  // 当文件被选中时
  app.eventBus.on("filetree:file-selected", ({ path: filePath, extension }) => {
    console.log(`[LiveFront] 文件选中: ${filePath}`);
  });

  // 当元素被选中时，更新右侧属性面板
  app.eventBus.on("preview:element-selected", (elementInfo) => {
    const content = document.getElementById("right-panel-content");
    if (content) {
      content.innerHTML = `
        <div class="prop-section">
          <div class="prop-label">标签</div>
          <div class="prop-value">&lt;${escapeHtml(elementInfo.tagName)}&gt;</div>
        </div>
        ${elementInfo.id ? `
        <div class="prop-section">
          <div class="prop-label">ID</div>
          <div class="prop-value">${escapeHtml(elementInfo.id)}</div>
        </div>` : ""}
        ${elementInfo.className ? `
        <div class="prop-section">
          <div class="prop-label">类名</div>
          <div class="prop-value">${escapeHtml(elementInfo.className)}</div>
        </div>` : ""}
        <div class="prop-section">
          <div class="prop-label">尺寸</div>
          <div class="prop-value">${elementInfo.rect.width} × ${elementInfo.rect.height}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">位置</div>
          <div class="prop-value">(${elementInfo.rect.x}, ${elementInfo.rect.y})</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">显示</div>
          <div class="prop-value">${elementInfo.styles.display}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">定位</div>
          <div class="prop-value">${elementInfo.styles.position}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">字号</div>
          <div class="prop-value">${elementInfo.styles.fontSize}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">字重</div>
          <div class="prop-value">${elementInfo.styles.fontWeight}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">颜色</div>
          <div class="prop-value" style="display:flex;align-items:center;gap:6px">
            <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${elementInfo.styles.color};border:1px solid var(--color-border)"></span>
            ${elementInfo.styles.color}
          </div>
        </div>
        <div class="prop-section">
          <div class="prop-label">背景</div>
          <div class="prop-value" style="display:flex;align-items:center;gap:6px">
            <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${elementInfo.styles.backgroundColor};border:1px solid var(--color-border)"></span>
            ${elementInfo.styles.backgroundColor}
          </div>
        </div>
      `;
    }

    // 切换到属性 Tab
    const panelTabs = document.querySelectorAll(".panel-tab");
    panelTabs.forEach((t) => t.classList.remove("active"));
    if (panelTabs[0]) panelTabs[0].classList.add("active");
  });

  // 新建文件按钮
  const newBtn = document.querySelector(".ft-new-btn");
  if (newBtn) {
    newBtn.addEventListener("click", async () => {
      const projectPath = app.services.getState("project.path");
      if (!projectPath) {
        app.services.toast("请先打开一个项目文件夹", "warning");
        return;
      }
      const name = prompt("输入文件名:");
      if (!name) return;
      const result = await app.ipc.fs.createFile(projectPath, name);
      if (result) {
        app.services.toast(`已创建: ${name}`, "success");
        filetreeModule.renderTree(projectPath);
      } else {
        app.services.toast("创建文件失败", "error");
      }
    });
  }
}

/**
 * 绑定全局 UI 交互事件
 */
function bindGlobalUI() {
  // 拓扑面板折叠/展开
  const topologyToggle = document.getElementById("topology-toggle");
  const topologyPanel = document.getElementById("topology-panel");
  if (topologyToggle && topologyPanel) {
    topologyToggle.addEventListener("click", () => {
      topologyPanel.classList.toggle("collapsed");
      topologyToggle.textContent = topologyPanel.classList.contains("collapsed") ? "▼" : "▲";
    });
  }

  // 右侧面板 Tab 切换
  const panelTabs = document.querySelectorAll(".panel-tab");
  panelTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      panelTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      app.eventBus.emit("panel:tab-change", tab.textContent);
    });
  });
}

/**
 * 获取应用信息并更新状态栏
 */
async function updateAppInfo() {
  try {
    const version = await app.ipc.invoke("app:getVersion");
    const name = await app.ipc.invoke("app:getName");
    const statusInfo = document.getElementById("status-info");
    if (statusInfo) {
      statusInfo.textContent = `${name} v${version}`;
    }
  } catch (err) {
    console.warn("[LiveFront] 获取应用信息失败:", err.message);
  }
}

// ── 欢迎页相关函数 ──

/**
 * 初始化欢迎页
 */
function initWelcomePage() {
  const welcomePage = document.getElementById("welcome-page");
  const workspace = document.getElementById("workspace");
  if (!welcomePage || !workspace) return;

  // 默认显示欢迎页，隐藏工作区
  welcomePage.removeAttribute("hidden");
  workspace.setAttribute("hidden", "");

  // "打开项目"按钮 → 直接打开文件夹对话框
  const btnOpen = document.getElementById("btn-open-project");
  if (btnOpen) {
    btnOpen.addEventListener("click", async () => {
      console.log("[Welcome] 点击打开项目");
      try {
        const folderPath = await app.ipc.fs.openFolder();
        if (!folderPath) return;
        const folderName = folderPath.split(/[\\\/]/).pop();
        app.services.setState("project.path", folderPath);
        app.services.setState("project.name", folderName);
        app.services.setState("project.isOpen", true);
        filetreeModule.renderTree(folderPath);
        app.eventBus.emit("filetree:folder-opened", { path: folderPath, name: folderName });
      } catch (err) {
        console.error("[Welcome] 打开文件夹失败:", err);
      }
    });
  }

  // "新建项目"按钮 → 提示暂未实现
  const btnNew = document.getElementById("btn-new-project");
  if (btnNew) {
    btnNew.addEventListener("click", () => {
      console.log("[Welcome] 点击新建项目");
      showWorkspace();
    });
  }

  // 监听项目打开事件，切换到工作区
  app.eventBus.on("filetree:folder-opened", () => {
    showWorkspace();
  });

  // 加载最近项目列表
  loadRecentProjects();
}

/**
 * 从欢迎页切换到主工作区
 */
function showWorkspace() {
  const welcomePage = document.getElementById("welcome-page");
  const workspace = document.getElementById("workspace");
  if (welcomePage) welcomePage.setAttribute("hidden", "");
  if (workspace) workspace.removeAttribute("hidden");
}

/**
 * 从主工作区切换回欢迎页
 */
function showWelcomePage() {
  const welcomePage = document.getElementById("welcome-page");
  const workspace = document.getElementById("workspace");
  if (welcomePage) welcomePage.removeAttribute("hidden");
  if (workspace) workspace.setAttribute("hidden", "");
}

/**
 * 保存最近项目到 localStorage
 */
function saveRecentProject(projectPath, name) {
  let recent = [];
  try {
    recent = JSON.parse(localStorage.getItem("livefront:recentProjects") || "[]");
  } catch {}
  recent = recent.filter((item) => item.path !== projectPath);
  recent.unshift({ path: projectPath, name, time: Date.now() });
  recent = recent.slice(0, 10);
  localStorage.setItem("livefront:recentProjects", JSON.stringify(recent));
}

/**
 * 加载最近项目列表
 */
function loadRecentProjects() {
  const list = document.getElementById("welcome-recent-list");
  if (!list) return;

  let recent = [];
  try {
    recent = JSON.parse(localStorage.getItem("livefront:recentProjects") || "[]");
  } catch {}

  if (recent.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--color-text-tertiary);font-size:var(--text-sm);padding:var(--space-lg) 0">暂无最近项目</div>';
    return;
  }

  list.innerHTML = recent.map((item) => `
    <div class="welcome-recent-item" data-path="${escapeHtml(item.path)}">
      <span class="welcome-recent-icon">📁</span>
      <div class="welcome-recent-info">
        <div class="welcome-recent-name">${escapeHtml(item.name)}</div>
        <div class="welcome-recent-path">${escapeHtml(item.path)}</div>
      </div>
    </div>
  `).join("");

  list.addEventListener("click", (e) => {
    const item = e.target.closest(".welcome-recent-item");
    if (!item) return;
    const projectPath = item.dataset.path;
    if (projectPath) {
      app.eventBus.emit("filetree:open-project", { path: projectPath });
    }
  });
}

/**
 * HTML 转义
 */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── 启动 ──
if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", initApp); } else { initApp(); }
