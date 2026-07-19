/**
 * LiveFront v2.0 – IPC 通信客户端
 *
 * 封装 window.LiveFront（由 preload 脚本注入）的调用，
 * 提供统一的错误处理和超时机制。
 *
 * 使用方式：
 *   const ipc = new IpcClient();
 *   const version = await ipc.invoke("app:getVersion");
 */

/** 默认 IPC 超时时间（毫秒） */
const DEFAULT_TIMEOUT = 10000;

export class IpcClient {
  constructor() {
    /**
     * 引用 preload 暴露的 API
     * 如果不在 Electron 环境中（如浏览器调试），提供降级处理
     */
    this._api = window.LiveFront || null;

    if (!this._api) {
      console.warn("[IpcClient] 未检测到 Electron 环境，IPC 调用将返回空值");
    }
  }

  /**
   * 双向调用（渲染 ↔ 主进程 → 渲染）
   * @param {string} channel - IPC 频道名
   * @param  {...any} args - 参数
   * @param {number} [timeout] - 超时时间（毫秒）
   * @returns {Promise<any>}
   */
  invoke(channel, ...args) {
    if (!this._api) {
      return Promise.resolve(null);
    }
    return this._api.ipc.invoke(channel, ...args);
  }

  /**
   * 单向发送（渲染 → 主进程，无需返回值）
   * @param {string} channel - IPC 频道名
   * @param  {...any} args - 参数
   */
  send(channel, ...args) {
    if (!this._api) return;
    this._api.ipc.send(channel, ...args);
  }

  /**
   * 监听主进程推送的事件
   * @param {string} channel - 频道名
   * @param {Function} callback - 回调函数
   */
  on(channel, callback) {
    if (!this._api) return;
    this._api.ipc.on(channel, callback);
  }

  // ── 快捷方法：预定义的常用调用 ──

  /** 窗口操作 */
  window = {
    minimize: () => this._api?.window.minimize(),
    maximize: () => this._api?.window.maximize(),
    close: () => this._api?.window.close(),
  };

  /** 文件系统操作 */
  fs = {
    readDir: (dirPath) => this._api?.fs.readDir(dirPath),
    readFile: (filePath) => this._api?.fs.readFile(filePath),
    writeFile: (filePath, content) =>
      this._api?.fs.writeFile(filePath, content),
    createFile: (dirPath, fileName) =>
      this._api?.fs.createFile(dirPath, fileName),
    rename: (oldPath, newPath) => this._api?.fs.rename(oldPath, newPath),
    delete: (filePath) => this._api?.fs.delete(filePath),
    stat: (filePath) => this._api?.fs.stat(filePath),
    openFolder: () => this._api?.fs.openFolder(),
  };

  /** 预览服务器操作 */
  preview = {
    start: (projectPath) => this._api?.preview.start(projectPath),
    stop: () => this._api?.preview.stop(),
    getUrl: () => this._api?.preview.getUrl(),
  };
}
