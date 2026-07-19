/**
 * LiveFront v2.0 – Preview Server
 *
 * 职责：
 *   启动本地 HTTP 静态服务器，为渲染进程 WebView 提供预览内容
 *   在 HTML 响应中注入 hover overlay 脚本，支持元素选择交互
 *
 * 特性：
 *   - 端口自动分配（默认 9527，被占用则自动递增）
 *   - 自动注入元素选择脚本到 HTML </body> 前
 *   - 正确的 MIME 类型映射
 */

import http from "http";
import fs from "fs";
import path from "path";

/** 默认起始端口 */
const DEFAULT_PORT = 9527;

/** 端口扫描上限 */
const MAX_PORT_ATTEMPTS = 100;

/** MIME 类型映射 */
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "text/xml; charset=utf-8",
};

/**
 * 要注入到 HTML 中的交互脚本
 * 提供：hover overlay、元素信息气泡、postMessage 通信
 */
const INJECT_SCRIPT = `
<script>
(function() {
  if (window.__livefront_injected__) return;
  window.__livefront_injected__ = true;

  let overlay = null;
  let label = null;
  let selectedOverlay = null;

  // 创建 hover overlay 元素
  overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;pointer-events:none;z-index:2147483646;" +
    "border:2px dashed #4f8ff7;background:rgba(79,143,247,0.08);" +
    "display:none;transition:all 80ms ease;";
  document.body.appendChild(overlay);

  // 创建标签名提示气泡
  label = document.createElement("div");
  label.style.cssText =
    "position:fixed;pointer-events:none;z-index:2147483647;" +
    "background:#1e1e32;color:#e8e8ed;font-size:11px;font-family:system-ui,sans-serif;" +
    "padding:2px 6px;border-radius:4px;border:1px solid #4f8ff7;" +
    "display:none;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);";
  document.body.appendChild(label);

  // 创建选中状态 overlay
  selectedOverlay = document.createElement("div");
  selectedOverlay.style.cssText =
    "position:fixed;pointer-events:none;z-index:2147483645;" +
    "border:2px solid #4f8ff7;background:rgba(79,143,247,0.12);" +
    "display:none;transition:all 80ms ease;";
  document.body.appendChild(selectedOverlay);

  function getElementInfo(el) {
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || "",
      className: el.className || "",
      text: (el.textContent || "").trim().substring(0, 100),
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      styles: {
        display: computed.display,
        position: computed.position,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
      },
    };
  }

  function buildTagLabel(el) {
    let text = el.tagName.toLowerCase();
    if (el.id) text += "#" + el.id;
    if (el.className && typeof el.className === "string") {
      const classes = el.className.trim().split(/\\s+/).slice(0, 3).join(".");
      if (classes) text += "." + classes;
    }
    return text;
  }

  // 监听 mouseover：显示 overlay + label
  document.addEventListener("mouseover", function(e) {
    if (e.target === overlay || e.target === label || e.target === selectedOverlay) return;
    const el = e.target;
    const rect = el.getBoundingClientRect();

    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.style.display = "block";

    label.textContent = buildTagLabel(el);
    label.style.left = (rect.left + 4) + "px";
    label.style.top = (rect.top - 22) + "px";
    label.style.display = "block";
  });

  // 监听 mouseout：隐藏 overlay + label
  document.addEventListener("mouseout", function(e) {
    if (e.target === overlay || e.target === label || e.target === selectedOverlay) return;
    overlay.style.display = "none";
    label.style.display = "none";
  });

  // 监听 contextmenu（右键）：提取元素信息并 postMessage
  document.addEventListener("contextmenu", function(e) {
    const el = e.target;
    const info = getElementInfo(el);

    // 显示选中状态
    selectedOverlay.style.left = info.rect.x + "px";
    selectedOverlay.style.top = info.rect.y + "px";
    selectedOverlay.style.width = info.rect.width + "px";
    selectedOverlay.style.height = info.rect.height + "px";
    selectedOverlay.style.display = "block";

    // 向父窗口发送元素信息
    try {
      window.parent.postMessage({ type: "element-selected", data: info }, "*");
    } catch(err) {
      console.warn("[LiveFront Inject] postMessage failed:", err);
    }
  });
})();
</script>
`;

/**
 * PreviewServer 类
 * 管理本地 HTTP 静态服务器的生命周期
 */
export class PreviewServer {
  constructor() {
    /** @type {http.Server|null} */
    this._server = null;
    /** 当前服务器端口 */
    this._port = null;
    /** 项目根目录 */
    this._projectPath = null;
    /** 是否正在运行 */
    this._running = false;
  }

  /**
   * 启动预览服务器
   * @param {string} projectPath - 项目文件夹路径
   * @returns {Promise<{ port: number, url: string }>}
   */
  async startServer(projectPath) {
    // 如果已在运行，先停止
    if (this._running) {
      await this.stopServer();
    }

    this._projectPath = projectPath;

    // 找到可用端口
    const port = await this._findAvailablePort();
    this._port = port;

    // 创建 HTTP 服务器
    this._server = http.createServer((req, res) => {
      this._handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      this._server.listen(port, "127.0.0.1", () => {
        this._running = true;
        const url = `http://127.0.0.1:${port}`;
        console.log(`[PreviewServer] 启动成功: ${url}`);
        resolve({ port, url });
      });

      this._server.on("error", (err) => {
        console.error("[PreviewServer] 服务器错误:", err);
        reject(err);
      });
    });
  }

  /**
   * 停止预览服务器
   * @returns {Promise<void>}
   */
  async stopServer() {
    if (this._server) {
      return new Promise((resolve) => {
        this._server.close(() => {
          this._server = null;
          this._running = false;
          this._port = null;
          console.log("[PreviewServer] 已停止");
          resolve();
        });
      });
    }
  }

  /**
   * 获取当前预览 URL
   * @returns {string|null}
   */
  getUrl() {
    if (!this._running) return null;
    return `http://127.0.0.1:${this._port}`;
  }

  /**
   * 获取当前端口
   * @returns {number|null}
   */
  getPort() {
    return this._port;
  }

  /**
   * 检查是否正在运行
   * @returns {boolean}
   */
  isRunning() {
    return this._running;
  }

  /**
   * 找到可用端口
   * 从 DEFAULT_PORT 开始，逐个尝试直到找到可用端口
   * @returns {Promise<number>}
   */
  async _findAvailablePort() {
    for (let i = 0; i < MAX_PORT_ATTEMPTS; i++) {
      const port = DEFAULT_PORT + i;
      const available = await this._checkPort(port);
      if (available) return port;
    }
    throw new Error("无法找到可用端口");
  }

  /**
   * 检查端口是否可用
   * @param {number} port
   * @returns {Promise<boolean>}
   */
  _checkPort(port) {
    return new Promise((resolve) => {
      const server = http.createServer();
      server.listen(port, "127.0.0.1", () => {
        server.close(() => resolve(true));
      });
      server.on("error", () => resolve(false));
    });
  }

  /**
   * 处理 HTTP 请求
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  _handleRequest(req, res) {
    // 解析 URL 路径
    let urlPath = decodeURIComponent(req.url.split("?")[0]);

    // 默认文件：index.html
    if (urlPath === "/") {
      urlPath = "/index.html";
    }

    // 构建文件系统路径
    const filePath = path.join(this._projectPath, urlPath);

    // 安全检查：防止路径穿越
    const resolvedPath = path.resolve(filePath);
    const resolvedProject = path.resolve(this._projectPath);
    if (!resolvedPath.startsWith(resolvedProject)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("403 Forbidden");
      return;
    }

    // 检查文件是否存在
    fs.stat(resolvedPath, (err, stats) => {
      if (err || !stats.isFile()) {
        // 如果没有扩展名，尝试加 .html
        if (!path.extname(urlPath)) {
          const htmlPath = resolvedPath + ".html";
          if (fs.existsSync(htmlPath)) {
            return this._serveFile(htmlPath, res);
          }
        }
        // 尝试 index.html
        const indexPath = path.join(resolvedPath, "index.html");
        if (fs.existsSync(indexPath)) {
          return this._serveFile(indexPath, res);
        }
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }

      this._serveFile(resolvedPath, res);
    });
  }

  /**
   * 提供文件内容
   * @param {string} filePath
   * @param {http.ServerResponse} res
   */
  _serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 Internal Server Error");
        return;
      }

      // 对 HTML 文件注入交互脚本
      if (ext === ".html" || ext === ".htm") {
        const content = data.toString("utf-8");
        let injected;

        // 优先在 </body> 前注入
        if (content.includes("</body>")) {
          injected = content.replace("</body>", INJECT_SCRIPT + "\n</body>");
        } else if (content.includes("</html>")) {
          injected = content.replace("</html>", INJECT_SCRIPT + "\n</html>");
        } else {
          injected = content + "\n" + INJECT_SCRIPT;
        }

        res.writeHead(200, {
          "Content-Type": mimeType,
          "Content-Length": Buffer.byteLength(injected, "utf-8"),
          "Cache-Control": "no-cache, no-store, must-revalidate",
        });
        res.end(injected);
      } else {
        res.writeHead(200, {
          "Content-Type": mimeType,
          "Content-Length": data.length,
          "Cache-Control": "no-cache",
        });
        res.end(data);
      }
    });
  }
}
