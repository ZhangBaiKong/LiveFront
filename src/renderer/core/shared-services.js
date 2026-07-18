/**
 * LiveFront v2.0 — 全局共享服务层
 *
 * 封装常用的全局能力：
 *   - 状态管理（响应式状态 + 变更通知）
 *   - UI 提示（Toast 通知）
 *   - 任务队列
 *
 * 所有模块通过 app.services 统一访问，避免各自实现重复逻辑。
 */

export class SharedServices {
  /**
   * @param {import("./event-bus.js").EventBus} eventBus - 全局事件总线
   * @param {import("./ipc-client.js").IpcClient} ipc - IPC 客户端
   */
  constructor(eventBus, ipc) {
    this.eventBus = eventBus;
    this.ipc = ipc;

    /**
     * 全局状态树
     * 模块应通过 getState / setState 读写，保持响应式
     */
    this._state = {
      project: {
        path: null,
        name: null,
        isOpen: false,
      },
      preview: {
        isRunning: false,
        port: null,
        url: null,
        device: "desktop", // desktop | tablet | mobile
      },
      selection: {
        element: null,
        selector: null,
        tagName: null,
        className: null,
        id: null,
      },
      ai: {
        isStreaming: false,
        messages: [],
        provider: null,
      },
      topology: {
        modules: [],
        connections: [],
        isAnalyzing: false,
      },
      settings: {
        ui: { theme: "dark" },
        terminal: { defaultShell: "powershell" },
        preview: { defaultDevice: "desktop", portPreference: 9527 },
        ai: { historySize: 100 },
      },
    };
  }

  /**
   * 获取状态（支持路径访问）
   * @param {string} [path] - 状态路径，如 "project.path"、"preview.device"
   * @returns {any}
   *
   * @example
   * services.getState("project.path")  // "/Users/..."
   * services.getState("preview")       // { isRunning: false, ... }
   * services.getState()                 // 完整状态树
   */
  getState(path) {
    if (!path) return this._state;

    const keys = path.split(".");
    let current = this._state;
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }

  /**
   * 设置状态（支持路径访问 + 自动通知）
   * @param {string} path - 状态路径
   * @param {any} value - 新值
   *
   * @example
   * services.setState("project.path", "/Users/me/project")
   * services.setState("preview.device", "tablet")
   */
  setState(path, value) {
    const keys = path.split(".");
    let current = this._state;

    // 导航到目标对象的父级
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] == null) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = value;

    // 通知状态变更
    this.eventBus.emit("state:change", { path, value, oldValue });
    this.eventBus.emit(`state:change:${path}`, { value, oldValue });
  }

  /**
   * 显示 Toast 通知
   * @param {string} message - 消息内容
   * @param {"info" | "success" | "warning" | "error"} [type="info"] - 通知类型
   * @param {number} [duration=3000] - 持续时间（毫秒）
   */
  toast(message, type = "info", duration = 3000) {
    this.eventBus.emit("toast:show", { message, type, duration });
    console.log(`[Toast][${type}] ${message}`);
  }

  /**
   * 更新状态栏项目信息
   * @param {string} text - 状态栏文本
   */
  updateStatus(text) {
    const el = document.getElementById("status-project");
    if (el) el.textContent = text;
  }
}

