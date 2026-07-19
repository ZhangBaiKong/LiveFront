/**
 * LiveFront v2.0 – Electron 主进程入口
 *
 * 职责：
 *   1. 创建应用主窗口（1400x900）
 *   2. 注册 IPC 通信频道
 *   3. 管理应用生命周期（单实例锁、窗口事件）
 *   4. 构建原生菜单栏
 */

import { app, BrowserWindow, ipcMain, Menu, dialog } from "electron";
import { join } from "path";
import fs from "fs";
import path from "path";
import { PreviewServer } from "./preview-server.js";

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

/** Preview Server 实例 */
const previewServer = new PreviewServer();

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
      webviewTag: true, // 启用 webview 标签（预览区需要）
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
        {
          label: "打开文件夹",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            mainWindow?.webContents.send("menu:openFolder");
          },
        },
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
 * 所有主进程 → 渲染进程的通信在此注册
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

  // ── 文件系统操作 ──

  /** 读取目录内容 */
  ipcMain.handle("fs:readDir", async (_event, dirPath) => {
    try {
      const entries = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      });
      // 过滤隐藏文件和 node_modules，排序（文件夹优先）
      const filtered = entries
        .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules")
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

      const result = [];
      for (const entry of filtered) {
        const fullPath = path.join(dirPath, entry.name);
        let stat = null;
        try {
          stat = await fs.promises.stat(fullPath);
        } catch {}
        result.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          size: stat?.size || 0,
          extension: entry.isFile() ? path.extname(entry.name).toLowerCase() : "",
        });
      }
      return result;
    } catch (err) {
      console.error("[fs:readDir] Error:", err.message);
      return [];
    }
  });

  /** 读取文件内容 */
  ipcMain.handle("fs:readFile", async (_event, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return content;
    } catch (err) {
      console.error("[fs:readFile] Error:", err.message);
      return null;
    }
  });

  /** 写入文件内容 */
  ipcMain.handle("fs:writeFile", async (_event, filePath, content) => {
    try {
      await fs.promises.writeFile(filePath, content, "utf-8");
      return true;
    } catch (err) {
      console.error("[fs:writeFile] Error:", err.message);
      return false;
    }
  });

  /** 创建新文件 */
  ipcMain.handle("fs:createFile", async (_event, dirPath, fileName) => {
    try {
      const filePath = path.join(dirPath, fileName);
      await fs.promises.writeFile(filePath, "", "utf-8");
      return filePath;
    } catch (err) {
      console.error("[fs:createFile] Error:", err.message);
      return null;
    }
  });

  /** 重命名文件/文件夹 */
  ipcMain.handle("fs:rename", async (_event, oldPath, newPath) => {
    try {
      await fs.promises.rename(oldPath, newPath);
      return true;
    } catch (err) {
      console.error("[fs:rename] Error:", err.message);
      return false;
    }
  });

  /** 删除文件/文件夹 */
  ipcMain.handle("fs:delete", async (_event, filePath) => {
    try {
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) {
        await fs.promises.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch (err) {
      console.error("[fs:delete] Error:", err.message);
      return false;
    }
  });

  /** 获取文件/文件夹信息 */
  ipcMain.handle("fs:stat", async (_event, filePath) => {
    try {
      const stat = await fs.promises.stat(filePath);
      return {
        size: stat.size,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
        mtime: stat.mtime.toISOString(),
      };
    } catch (err) {
      console.error("[fs:stat] Error:", err.message);
      return null;
    }
  });

  /** 打开文件夹选择对话框 */
  ipcMain.handle("fs:openFolder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "选择项目文件夹",
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // ── 预览服务器操作 ──

  /** 启动预览服务器 */
  ipcMain.handle("preview:start", async (_event, projectPath) => {
    try {
      const result = await previewServer.startServer(projectPath);
      return result;
    } catch (err) {
      console.error("[preview:start] Error:", err.message);
      return null;
    }
  });

  /** 停止预览服务器 */
  ipcMain.handle("preview:stop", async () => {
    try {
      await previewServer.stopServer();
      return true;
    } catch (err) {
      console.error("[preview:stop] Error:", err.message);
      return false;
    }
  });

  /** 获取预览 URL */
  ipcMain.handle("preview:getUrl", () => {
    return previewServer.getUrl();
  });
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

// 应用退出前停止预览服务器
app.on("before-quit", () => {
  previewServer.stopServer();
});

// 全局未捕获异常兜底，防止主进程崩溃
process.on("uncaughtException", (error) => {
  console.error("[LiveFront] 未捕获异常:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[LiveFront] 未处理的 Promise 拒绝:", reason);
});

