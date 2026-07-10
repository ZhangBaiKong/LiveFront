/* LiveFront Preview Server — 主进程 HTTP 服务 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.map': 'application/json'
}

// 注入到 HTML 文件的增强脚本
function getInjectedScript() {
  return `
<script>
(function() {
  // ── 元素选中 & Hover 高亮 ──
  let _hoverOverlay = null;
  let _selectedOverlay = null;
  let _infoBubble = null;
  let _selectedEl = null;
  let _pickerActive = true;

  function createOverlay(type) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;transition:all 80ms ease;border:2px dashed ' + (type === 'hover' ? 'rgba(74,108,247,0.4)' : 'rgba(74,108,247,0.8)') + ';background:' + (type === 'hover' ? 'rgba(74,108,247,0.06)' : 'rgba(74,108,247,0.1)') + ';';
    document.body.appendChild(div);
    return div;
  }

  function createInfoBubble() {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;font-family:system-ui,sans-serif;font-size:11px;padding:3px 8px;background:#1a1a24;color:#e4e4e7;border:1px solid rgba(255,255,255,0.1);border-radius:4px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);';
    document.body.appendChild(div);
    return div;
  }

  function positionOverlay(overlay, el) {
    const r = el.getBoundingClientRect();
    overlay.style.left = r.left + 'px';
    overlay.style.top = r.top + 'px';
    overlay.style.width = r.width + 'px';
    overlay.style.height = r.height + 'px';
  }

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    let sel = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\\s+/).join('.');
      if (cls) sel += '.' + cls;
    }
    return sel;
  }

  function getElementInfo(el) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      action: 'element-selected',
      tagName: el.tagName,
      className: el.className && typeof el.className === 'string' ? el.className : '',
      id: el.id || '',
      selector: getSelector(el),
      outerHTML: el.outerHTML.length > 2000 ? el.outerHTML.substring(0, 2000) + '...' : el.outerHTML,
      textContent: (el.textContent || '').substring(0, 500),
      rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
      computedStyles: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        display: cs.display,
        position: cs.position,
        padding: cs.padding,
        margin: cs.margin,
        border: cs.border,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        opacity: cs.opacity,
        width: cs.width,
        height: cs.height,
        textAlign: cs.textAlign,
        overflow: cs.overflow,
      }
    };
  }

  // hover 效果
  document.addEventListener('mouseover', function(e) {
    if (!_pickerActive) return;
    const el = e.target;
    if (el === document.body || el === document.documentElement) return;
    if (el.style.position === 'fixed' && el.style.pointerEvents === 'none') return;
    if (!_hoverOverlay) _hoverOverlay = createOverlay('hover');
    positionOverlay(_hoverOverlay, el);
    if (!_infoBubble) _infoBubble = createInfoBubble();
    const r = el.getBoundingClientRect();
    _infoBubble.textContent = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/)[0] : '');
    _infoBubble.style.left = r.left + 'px';
    _infoBubble.style.top = (r.top - 24) + 'px';
    _infoBubble.style.display = 'block';
  });

  document.addEventListener('mouseout', function(e) {
    if (_hoverOverlay) { _hoverOverlay.style.width = '0'; _hoverOverlay.style.height = '0'; }
    if (_infoBubble) _infoBubble.style.display = 'none';
  });

  // 点击选中
  document.addEventListener('click', function(e) {
    if (!_pickerActive) return;
    const el = e.target;
    if (el === document.body || el === document.documentElement) return;
    // 忽略注入的 overlay
    if (el.style && el.style.position === 'fixed' && el.style.pointerEvents === 'none') return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    _selectedEl = el;
    if (!_selectedOverlay) _selectedOverlay = createOverlay('selected');
    positionOverlay(_selectedOverlay, el);

    const info = getElementInfo(el);
    window.parent.postMessage(info, '*');
    if (!window.__lf_events) window.__lf_events = [];
    window.__lf_events.push(info);
  }, true);

  // ESC 取消选中
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (_selectedOverlay) { _selectedOverlay.style.width = '0'; _selectedOverlay.style.height = '0'; }
      _selectedEl = null;
      window.parent.postMessage({ action: 'element-deselected' }, '*');
      if (!window.__lf_events) window.__lf_events = [];
      window.__lf_events.push({ action: 'element-deselected' });
    }
  });

  // 点击空白取消选中
  document.addEventListener('click', function(e) {
    if (e.target === document.body || e.target === document.documentElement) {
      if (_selectedOverlay) { _selectedOverlay.style.width = '0'; _selectedOverlay.style.height = '0'; }
      _selectedEl = null;
      window.parent.postMessage({ action: 'element-deselected' }, '*');
    }
  });

  // ── Console 拦截 ──
  const _origConsole = { log: console.log, warn: console.warn, error: console.error };
  ['log', 'warn', 'error'].forEach(function(level) {
    console[level] = function() {
      _origConsole[level].apply(console, arguments);
      try {
        const args = Array.from(arguments).map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); }
        });
        window.parent.postMessage({ action: 'console', level: level, content: args.join(' '), timestamp: Date.now() }, '*');
        if (!window.__lf_events) window.__lf_events = [];
        window.__lf_events.push({ action: 'console', level: level, content: args.join(' '), timestamp: Date.now() });
      } catch(e) {}
    };
  });

  window.parent.postMessage({ action: 'preview-ready' }, '*');
  if (!window.__lf_events) window.__lf_events = [];
  window.__lf_events.push({ action: 'preview-ready' });
})();
</script>
`
}

class PreviewServer {
  constructor() {
    this._server = null
    this._port = 0
    this._projectPath = null
    this._effects = ''  // 注入的效果 CSS
    this._tailwind = false
  }

  start(projectPath, options = {}) {
    this._projectPath = projectPath
    this._effects = options.effects || ''
    this._tailwind = !!options.tailwind

    return new Promise((resolve, reject) => {
      if (this._server) {
        this.stop().then(() => this._startServer(resolve, reject))
      } else {
        this._startServer(resolve, reject)
      }
    })
  }

  _startServer(resolve, reject) {
    this._server = http.createServer((req, res) => {
      this._handleRequest(req, res)
    })

    this._server.listen(0, '127.0.0.1', () => {
      this._port = this._server.address().port
      console.log('[PreviewServer] Started on port', this._port)
      resolve(this._port)
    })

    this._server.on('error', (err) => {
      console.error('[PreviewServer] Error:', err)
      reject(err)
    })
  }

  stop() {
    return new Promise((resolve) => {
      if (this._server) {
        this._server.close(() => {
          this._server = null
          this._port = 0
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  getPort() {
    return this._port
  }

  getUrl(filePath) {
    if (!this._port) return ''
    const relPath = filePath ? path.relative(this._projectPath, filePath).replace(/\\\\/g, '/') : '/index.html'
    return 'http://127.0.0.1:' + this._port + '/' + relPath
  }

  setEffects(css) {
    this._effects = css || ''
  }

  _handleRequest(req, res) {
    // 解析 URL 路径
    let urlPath = decodeURIComponent(req.url.split('?')[0])
    if (urlPath === '/') urlPath = '/index.html'

    // 安全检查：防止路径穿越
    const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '')
    const filePath = path.join(this._projectPath, safePath)

    // 确保请求的文件在项目目录内
    if (!filePath.startsWith(this._projectPath)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('403 Forbidden')
      return
    }

    // 检查文件是否存在
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        // 尝试 index.html
        if (urlPath.endsWith('/')) {
          const indexPath = path.join(filePath, 'index.html')
          if (fs.existsSync(indexPath)) {
            return this._serveFile(indexPath, '.html', res)
          }
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('404 Not Found: ' + urlPath)
        return
      }

      const ext = path.extname(filePath).toLowerCase()
      this._serveFile(filePath, ext, res)
    })
  }

  _serveFile(filePath, ext, res) {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('500 Internal Server Error')
        return
      }

      const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

      // HTML 文件：注入增强脚本
      if (ext === '.html' || ext === '.htm') {
        let html = data.toString('utf-8')

        // 注入 Tailwind CDN（如果开启）
        if (this._tailwind) {
          const tailwindTag = '<script src="https://cdn.tailwindcss.com"></script>'
          if (html.includes('</head>')) {
            html = html.replace('</head>', tailwindTag + '\n</head>')
          }
        }

        // 注入效果 CSS
        if (this._effects) {
          const styleTag = '<style id="livefront-effects">' + this._effects + '</style>'
          if (html.includes('</head>')) {
            html = html.replace('</head>', styleTag + '\n</head>')
          }
        }

        // 注入增强脚本
        const injectScript = getInjectedScript()
        if (html.includes('</body>')) {
          html = html.replace('</body>', injectScript + '\n</body>')
        } else {
          html += injectScript
        }

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(html)
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(data)
      }
    })
  }
}

module.exports = PreviewServer