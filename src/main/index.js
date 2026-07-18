/**
 * LiveFront v2.0 — Electron 主进程入口
 *
 * 职责：
 *   1. 创建应用主窗口（1400x900）
 *   2. 注册 IPC 通信频道
 *   3. 管理应用生命周期（单实例锁、窗口事件）
 *   4. 构建原生菜单栏
 */

import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { join } from "path";

// ── 环境判断 ──
const isDev = !app.isPackaged;

// ── 窗口配置常量 ──
const WINDOW_CONFIG = {
  width: 1400,
  height: 900,
  minWidth: 1000,
  minHeight: 600,
  title: "LiveFront",
  backgroundColor: "#0d0d14", // 与 --color-bg-primary 一致，防止白屏闪烁
};

/** 主窗口实例引用 */
let mainWindow = null;

/**
 * 创建主窗口
 * 加载 preload 脚本，配置 webPreferences 安全策略
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    show: false, // 等 ready-to-show 后再显示，避免白屏闪烁
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true, // 隔离上下文，安全第一
      nodeIntegration: false, // 禁用渲染进程 Node.js 访问
      sandbox: true, // 启用沙箱
    },
  });

  // 窗口准备好后显示，避免加载过程中的白屏
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // 根据环境加载内容
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  // 窗口关闭时清空引用
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * 构建原生菜单栏
 * 包含：文件、编辑、视图、帮助
 */
function buildApplicationMenu() {
  const template = [
    {
      label: "文件",
      submenu: [
        { label: "打开文件夹…", accelerator: "CmdOrCtrl+O" },
        { label: "最近项目", enabled: false },
        { type: "separator" },
        { role: "quit", label: "退出" },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" },
        { role: "selectAll", label: "全选" },
      ],
    },
    {
      label: "视图",
      submenu: [
        { role: "reload", label: "重新加载" },
        { role: "forceReload", label: "强制重新加载" },
        { role: "toggleDevTools", label: "开发者工具" },
        { type: "separator" },
        { role: "resetZoom", label: "重置缩放" },
        { role: "zoomIn", label: "放大" },
        { role: "zoomOut", label: "缩小" },
        { type: "separator" },
        { role: "togglefullscreen", label: "全屏" },
      ],
    },
    {
      label: "帮助",
      submenu: [
        { label: "关于 LiveFront", enabled: false },
        { label: "文档", enabled: false },
        { type: "separator" },
        { label: "版本 v2.0.0", enabled: false },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * 注册全局 IPC 频道
 * 所有主进程 ↔ 渲染进程的通信在此注册
 */
function registerIpcHandlers() {
  // ── 应用信息 ──
  ipcMain.handle("app:getVersion", () => app.getVersion());
  ipcMain.handle("app:getName", () => app.getName());

  // ── 窗口操作 ──
  ipcMain.handle("window:minimize", () => mainWindow?.minimize());
  ipcMain.handle("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle("window:close", () => mainWindow?.close());

  // 后续模块会在此追加更多 IPC 频道
  // 例如：fs:*、preview:*、ai:*、terminal:* 等
}

// ── 应用生命周期 ──

app.whenReady().then(() => {
  buildApplicationMenu();
  registerIpcHandlers();
  createMainWindow();

  // macOS：点击 dock 图标时重新创建窗口
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 所有窗口关闭时退出（macOS 除外）
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 全局未捕获异常兜底，防止主进程崩溃
process.on("uncaughtException", (error) => {
  console.error("[LiveFront] 未捕获异常:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[LiveFront] 未处理的 Promise 拒绝:", reason);
});

