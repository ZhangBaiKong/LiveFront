/**
 * LiveFront v2.0 — electron-vite 配置
 *
 * 配置 main、preload、renderer 三个入口：
 *   - main:     Electron 主进程（Node.js 环境）
 *   - preload:  预加载脚本（Node.js + 沙箱环境）
 *   - renderer: 渲染进程（浏览器环境，纯 HTML/CSS/JS，无框架）
 */

import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  /**
   * 主进程配置
   * 入口：src/main/index.js
   * 输出：out/main/
   */
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.js"),
        },
      },
    },
  },

  /**
   * 预加载脚本配置
   * 入口：src/preload/index.js
   * 输出：out/preload/
   */
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.js"),
        },
      },
    },
  },

  /**
   * 渲染进程配置
   * 入口：src/renderer/index.html
   * 输出：out/renderer/
   *
   * 纯 HTML/CSS/JS，无框架，无需 JSX 或 Vue 插件
   */
  renderer: {
    root: resolve(__dirname, "src/renderer"),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
    },
  },
});

