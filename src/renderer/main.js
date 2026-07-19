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

  // 7. 标记就绪
  app.ready = true;
  app.eventBus.emit("app:ready");
  console.log("[LiveFront] 应用就绪 \u2705");
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
  // 当文件夹被打开时，启动预览
  app.eventBus.on("filetree:folder-opened", async ({ path: projectPath, name }) => {
    console.log(`[LiveFront] 项目已打开: ${name} (${projectPath})`);

    // 启动预览
    await previewModule.startPreview(projectPath);
  });

  // 当文件被选中时，如果是 HTML 文件且当前没有预览，可以单独预览
  app.eventBus.on("filetree:file-selected", ({ path: filePath, extension }) => {
    console.log(`[LiveFront] 文件选中: ${filePath}`);
    // 后续可以实现：单文件预览、代码编辑等功能
  });

  // 当元素被选中时，更新右侧属性面板
  app.eventBus.on("preview:element-selected", (elementInfo) => {
    const content = document.getElementById("right-panel-content");
    if (content) {
      content.innerHTML = `
        <div class="prop-section">
          <div class="prop-label">\u6807\u7b7e</div>
          <div class="prop-value">&lt;${escapeHtml(elementInfo.tagName)}&gt;</div>
        </div>
        ${elementInfo.id ? `
        <div class="prop-section">
          <div class="prop-label">ID</div>
          <div class="prop-value">${escapeHtml(elementInfo.id)}</div>
        </div>` : ""}
        ${elementInfo.className ? `
        <div class="prop-section">
          <div class="prop-label">\u7c7b\u540d</div>
          <div class="prop-value">${escapeHtml(elementInfo.className)}</div>
        </div>` : ""}
        <div class="prop-section">
          <div class="prop-label">\u5c3a\u5bf8</div>
          <div class="prop-value">${elementInfo.rect.width} \u00d7 ${elementInfo.rect.height}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">\u4f4d\u7f6e</div>
          <div class="prop-value">(${elementInfo.rect.x}, ${elementInfo.rect.y})</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">\u663e\u793a</div>
          <div class="prop-value">${elementInfo.styles.display}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">\u5b9a\u4f4d</div>
          <div class="prop-value">${elementInfo.styles.position}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">\u5b57\u53f7</div>
          <div class="prop-value">${elementInfo.styles.fontSize}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">\u5b57\u91cd</div>
          <div class="prop-value">${elementInfo.styles.fontWeight}</div>
        </div>
        <div class="prop-section">
          <div class="prop-label">\u989c\u8272</div>
          <div class="prop-value" style="display:flex;align-items:center;gap:6px">
            <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${elementInfo.styles.color};border:1px solid var(--color-border)"></span>
            ${elementInfo.styles.color}
          </div>
        </div>
        <div class="prop-section">
          <div class="prop-label">\u80cc\u666f</div>
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
        app.services.toast("\u8bf7\u5148\u6253\u5f00\u4e00\u4e2a\u9879\u76ee\u6587\u4ef6\u5939", "warning");
        return;
      }
      const name = prompt("\u8f93\u5165\u6587\u4ef6\u540d:");
      if (!name) return;
      const result = await app.ipc.fs.createFile(projectPath, name);
      if (result) {
        app.services.toast(`\u5df2\u521b\u5efa: ${name}`, "success");
        filetreeModule.renderTree(projectPath);
      } else {
        app.services.toast("\u521b\u5efa\u6587\u4ef6\u5931\u8d25", "error");
      }
    });
  }
}

/**
 * 绑定全局 UI 交互事件
 * 处理窗口控制按钮、拓扑面板折叠等
 */
function bindGlobalUI() {
  // 拓扑面板折叠/展开
  const topologyToggle = document.getElementById("topology-toggle");
  const topologyPanel = document.getElementById("topology-panel");
  if (topologyToggle && topologyPanel) {
    topologyToggle.addEventListener("click", () => {
      topologyPanel.classList.toggle("collapsed");
      topologyToggle.textContent = topologyPanel.classList.contains("collapsed") ? "\u25bc" : "\u25b2";
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

/**
 * HTML 转义
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── 启动 ──
document.addEventListener("DOMContentLoaded", initApp);
