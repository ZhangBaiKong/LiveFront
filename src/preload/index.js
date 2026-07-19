/**
 * LiveFront v2.0 – 预加载脚本
 *
 * 职责：
 *   通过 contextBridge 安全地向渲染进程暴露 API
 *   所有主进程能力必须通过 IPC 调用，渲染进程无法直接访问 Node.js
 *
 * 安全原则：
 *   - contextIsolation: true（主进程中已配置）
 *   - 仅暴露白名单中的 IPC 频道
 *   - 不暴露任何 Node.js 原生模块
 */

import { contextBridge, ipcRenderer } from "electron";

/**
 * IPC 频道白名单
 * 只有在此列表中的频道才允许渲染进程调用
 */
const IPC_CHANNELS = {
  invoke: [
    "app:getVersion",
    "app:getName",
    "window:minimize",
    "window:maximize",
    "window:close",
    // 文件系统
    "fs:readDir",
    "fs:readFile",
    "fs:writeFile",
    "fs:createFile",
    "fs:rename",
    "fs:delete",
    "fs:stat",
    "fs:openFolder",
    // 预览服务器
    "preview:start",
    "preview:stop",
    "preview:getUrl",
  ],
  send: [
    // 单向发送频道（渲染 → 主进程）
  ],
  on: [
    // 监听频道（主进程 → 渲染进程）
    "preview:message",
    "menu:openFolder",
  ],
};

/**
 * 校验频道是否在白名单中
 * @param {string} channel - IPC 频道名
 * @param {string} type - 调用类型：invoke / send / on
 * @returns {boolean}
 */
function isChannelAllowed(channel, type) {
  return IPC_CHANNELS[type]?.includes(channel) ?? false;
}

/**
 * 暴露给渲染进程的 API
 * 通过 window.LiveFront 访问
 */
contextBridge.exposeInMainWorld("LiveFront", {
  /**
   * 应用相关 API
   */
  app: {
    /** 获取应用版本号 */
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
    /** 获取应用名称 */
    getName: () => ipcRenderer.invoke("app:getName"),
  },

  /**
   * 窗口操作 API
   */
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
  },

  /**
   * 文件系统 API
   */
  fs: {
    readDir: (dirPath) => ipcRenderer.invoke("fs:readDir", dirPath),
    readFile: (filePath) => ipcRenderer.invoke("fs:readFile", filePath),
    writeFile: (filePath, content) =>
      ipcRenderer.invoke("fs:writeFile", filePath, content),
    createFile: (dirPath, fileName) =>
      ipcRenderer.invoke("fs:createFile", dirPath, fileName),
    rename: (oldPath, newPath) =>
      ipcRenderer.invoke("fs:rename", oldPath, newPath),
    delete: (filePath) => ipcRenderer.invoke("fs:delete", filePath),
    stat: (filePath) => ipcRenderer.invoke("fs:stat", filePath),
    openFolder: () => ipcRenderer.invoke("fs:openFolder"),
  },

  /**
   * 预览服务器 API
   */
  preview: {
    start: (projectPath) => ipcRenderer.invoke("preview:start", projectPath),
    stop: () => ipcRenderer.invoke("preview:stop"),
    getUrl: () => ipcRenderer.invoke("preview:getUrl"),
  },

  /**
   * 通用 IPC 调用（带白名单校验）
   * @param {string} channel - 频道名
   * @param  {...any} args - 参数
   * @returns {Promise<any>}
   */
  ipc: {
    invoke: (channel, ...args) => {
      if (isChannelAllowed(channel, "invoke")) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`IPC 频道 "${channel}" 不在白名单中`));
    },
    send: (channel, ...args) => {
      if (isChannelAllowed(channel, "send")) {
        ipcRenderer.send(channel, ...args);
      } else {
        console.warn(`[LiveFront] 尝试调用未授权频道: ${channel}`);
      }
    },
    on: (channel, callback) => {
      if (isChannelAllowed(channel, "on")) {
        ipcRenderer.on(channel, (_event, ...args) => callback(...args));
      } else {
        console.warn(`[LiveFront] 尝试监听未授权频道: ${channel}`);
      }
    },
  },
});