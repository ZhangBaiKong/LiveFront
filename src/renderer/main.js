/**
 * LiveFront v2.0 — 渲染进程入口
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
  /** 应用是否已就绪 */
  ready: false,
};

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

  // 3. 绑定顶层 UI 事件
  bindGlobalUI();

  // 4. 获取应用信息并更新状态栏
  await updateAppInfo();

  // 5. 标记就绪
  app.ready = true;
  app.eventBus.emit("app:ready");
  console.log("[LiveFront] 应用就绪 ✓");
}

/**
 * 绑定全局 UI 交互事件
 * 处理窗口控制按钮、拓扑面板折叠等
 */
function bindGlobalUI() {
  // 窗口控制按钮（仅在无原生标题栏时启用）
  // 当前使用原生标题栏，以下为备用
  const minimizeBtn = document.getElementById("btn-minimize");
  const maximizeBtn = document.getElementById("btn-maximize");
  const closeBtn = document.getElementById("btn-close");

  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", () => app.ipc.window.minimize());
  }
  if (maximizeBtn) {
    maximizeBtn.addEventListener("click", () => app.ipc.window.maximize());
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => app.ipc.window.close());
  }

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

// ── 启动 ──
document.addEventListener("DOMContentLoaded", initApp);

