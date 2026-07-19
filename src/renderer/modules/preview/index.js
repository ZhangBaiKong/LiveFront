/**
 * LiveFront v2.0 – 预览区模块
 *
 * 职责：
 *   - 启动/停止 Preview Server
 *   - 创建/加载 WebView
 *   - 设备切换（desktop/tablet/mobile）
 *   - URL 栏显示与刷新
 *   - 监听 WebView 的 postMessage 事件（元素选择）
 */

/** @type {object} 应用上下文（init 时注入） */
let ctx = null;

/** @type {HTMLIFrameElement|null} 当前预览 iframe */
let previewFrame = null;

/** 当前预览 URL */
let currentUrl = null;

/** 当前设备类型 */
let currentDevice = "desktop";

/** 设备尺寸配置 */
const DEVICE_SIZES = {
  desktop: { width: "100%", height: "100%", label: "🗺️" },
  tablet: { width: "768px", height: "1024px", label: "📱" },
  mobile: { width: "375px", height: "812px", label: "📱" },
};

/**
 * 启动预览
 * @param {string} projectPath - 项目路径
 */
async function startPreview(projectPath) {
  const container = document.getElementById("preview-container");
  if (!container) return;

  // 显示加载状态
  container.innerHTML = `
    <div class="preview-loading">
      <div class="preview-loading-spinner"></div>
      <span>正在启动预览...</span>
    </div>`;

  try {
    // 启动预览服务器
    const result = await ctx.ipc.preview.start(projectPath);
    if (!result) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">⚠️</span>
          <span class="empty-state-text">预览服务器启动失败</span>
        </div>`;
      return;
    }

    currentUrl = result.url;
    ctx.services.setState("preview.isRunning", true);
    ctx.services.setState("preview.port", result.port);
    ctx.services.setState("preview.url", result.url);

    // 更新 URL 栏
    updateUrlBar(result.url);

    // 创建 iframe 加载预览
    createPreviewFrame(container, result.url);
  } catch (err) {
    console.error("[Preview] 启动失败:", err);
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">⚠️</span>
        <span class="empty-state-text">预览启动失败: ${escapeHtml(err.message)}</span>
      </div>`;
  }
}

/**
 * 创建预览 iframe
 * @param {HTMLElement} container - 容器元素
 * @param {string} url - 预览 URL
 */
function createPreviewFrame(container, url) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "preview-frame-wrapper";
  applyDeviceSize(wrapper);

  previewFrame = document.createElement("iframe");
  previewFrame.className = "preview-frame";
  previewFrame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
  previewFrame.setAttribute("allow", "clipboard-read; clipboard-write");
  previewFrame.src = url;

  // 加载完成
  previewFrame.addEventListener("load", () => {
    const loading = container.querySelector(".preview-loading");
    if (loading) loading.remove();
    console.log("[Preview] 页面加载完成");
  });

  wrapper.appendChild(previewFrame);
  container.appendChild(wrapper);

  // 监听 postMessage 事件（元素选择）
  window.addEventListener("message", handlePostMessage);
}

/**
 * 处理来自预览 iframe 的 postMessage
 * @param {MessageEvent} event
 */
function handlePostMessage(event) {
  if (!event.data || event.data.type !== "element-selected") return;

  const elementInfo = event.data.data;
  console.log("[Preview] 元素选中:", elementInfo);

  // 更新状态
  ctx.services.setState("selection.tagName", elementInfo.tagName);
  ctx.services.setState("selection.id", elementInfo.id);
  ctx.services.setState("selection.className", elementInfo.className);
  ctx.services.setState("selection.element", elementInfo);

  // 发射事件
  ctx.eventBus.emit("preview:element-selected", elementInfo);
}

/**
 * 停止预览
 */
async function stopPreview() {
  try {
    await ctx.ipc.preview.stop();
  } catch {}

  currentUrl = null;
  previewFrame = null;

  ctx.services.setState("preview.isRunning", false);
  ctx.services.setState("preview.port", null);
  ctx.services.setState("preview.url", null);

  // 移除事件监听
  window.removeEventListener("message", handlePostMessage);

  // 恢复空状态
  const container = document.getElementById("preview-container");
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🎨</span>
        <span class="empty-state-text">预览区将在打开项目后显示</span>
      </div>`;
  }

  updateUrlBar(null);
}

/**
 * 刷新预览
 */
function refresh() {
  if (previewFrame) {
    previewFrame.src = previewFrame.src;
    console.log("[Preview] 刷新预览");
  }
}

/**
 * 在外部浏览器中打开
 */
function openInBrowser() {
  if (currentUrl) {
    ctx.ipc.invoke("shell:openExternal", currentUrl);
  }
}

/**
 * 设置设备尺寸
 * @param {"desktop"|"tablet"|"mobile"} device
 */
function setDevice(device) {
  if (!DEVICE_SIZES[device]) return;

  currentDevice = device;
  ctx.services.setState("preview.device", device);

  // 更新按钮状态
  document.querySelectorAll(".device-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.device === device);
  });

  // 更新预览框尺寸
  const wrapper = document.querySelector(".preview-frame-wrapper");
  if (wrapper) {
    applyDeviceSize(wrapper);
  }

  console.log(`[Preview] 设备切换: ${device}`);
}

/**
 * 应用设备尺寸到元素
 * @param {HTMLElement} el
 */
function applyDeviceSize(el) {
  const size = DEVICE_SIZES[currentDevice];
  el.style.width = size.width;
  el.style.height = size.height;
  el.style.maxWidth = "100%";
  el.style.maxHeight = "100%";
  el.style.margin = currentDevice === "desktop" ? "0" : "0 auto";
  el.style.transition = "width 200ms ease, height 200ms ease";
}

/**
 * 更新 URL 栏显示
 * @param {string|null} url
 */
function updateUrlBar(url) {
  const urlBar = document.getElementById("preview-url");
  if (urlBar) {
    urlBar.textContent = url || "等待预览…";
  }
}

/**
 * HTML 转义
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * 绑定预览区 UI 交互事件
 */
function bindEvents() {
  // 设备切换按钮
  document.querySelectorAll(".device-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setDevice(btn.dataset.device);
    });
  });

  // 刷新按钮
  const refreshBtn = document.querySelector(".preview-actions .preview-btn[title='↻ 刷新预览']");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refresh);
  }

  // 外部打开按钮
  const openBtn = document.querySelector(".preview-actions .preview-btn[title='↗ 在浏览器中打开']");
  if (openBtn) {
    openBtn.addEventListener("click", openInBrowser);
  }
}

/**
 * 模块 manifest
 */
const manifest = {
  id: "preview",
  dependencies: [],
  commands: ["preview.refresh", "preview.setDevice"],

  /**
   * 模块初始化
   * @param {object} context - 应用上下文
   */
  init(context) {
    ctx = context;
    console.log("[Preview] 模块初始化");

    bindEvents();

    // 注册命令
    ctx.commands?.register("preview.refresh", refresh);
    ctx.commands?.register("preview.setDevice", setDevice);
  },

  /** 启动预览（供外部调用） */
  startPreview,
  /** 停止预览（供外部调用） */
  stopPreview,
  /** 刷新预览（供外部调用） */
  refresh,
  /** 设置设备（供外部调用） */
  setDevice,
};

// 注册模块
if (typeof window !== "undefined" && window.LiveFront?.modules) {
  window.LiveFront.modules.register(manifest);
}

export default manifest;
