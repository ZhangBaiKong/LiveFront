const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { join } = require('path');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const http = require('http');
const simpleGit = require('simple-git');
const archiver = require('archiver');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject', '.otf': 'font/otf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.map': 'application/json'
};

function getInjectedScript() {
  return `
<script>
(function() {
  window.__lf_events = [];
  window.__lf_selected = null;
  function _emit(d) { window.__lf_events.push(d); }
  var _ho = null, _so = null, _ib = null, _pk = true;
  function co(t) {
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;transition:all 80ms ease;border:2px dashed '+(t==='hover'?'rgba(74,108,247,0.4)':'rgba(74,108,247,0.8)')+';background:'+(t==='hover'?'rgba(74,108,247,0.06)':'rgba(74,108,247,0.1)')+';';
    document.body.appendChild(d); return d;
  }
  function cb() {
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;font-family:system-ui,sans-serif;font-size:11px;padding:3px 8px;background:#1a1a24;color:#e4e4e7;border:1px solid rgba(255,255,255,0.1);border-radius:4px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);';
    document.body.appendChild(d); return d;
  }
  function po(o, el) {
    var r = el.getBoundingClientRect();
    o.style.left = r.left+'px'; o.style.top = r.top+'px';
    o.style.width = r.width+'px'; o.style.height = r.height+'px';
  }
  function gs(el) {
    if (el.id) return '#'+el.id;
    var s = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      var c = el.className.trim().split(/\s+/).join('.');
      if (c) s += '.'+c;
    }
    return s;
  }
  function gi(el) {
    var r = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    return {
      action: 'element-selected', tagName: el.tagName,
      className: el.className && typeof el.className === 'string' ? el.className : '',
      id: el.id || '', selector: gs(el),
      outerHTML: (el.outerHTML||'').substring(0, 2000),
      textContent: (el.textContent||'').substring(0, 500),
      rect: {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)},
      computedStyles: {
        color:cs.color, backgroundColor:cs.backgroundColor, fontSize:cs.fontSize,
        fontFamily:cs.fontFamily, fontWeight:cs.fontWeight, lineHeight:cs.lineHeight,
        display:cs.display, position:cs.position, padding:cs.padding, margin:cs.margin,
        border:cs.border, borderRadius:cs.borderRadius, boxShadow:cs.boxShadow,
        opacity:cs.opacity, width:cs.width, height:cs.height, textAlign:cs.textAlign, overflow:cs.overflow
      }
    };
  }
  document.addEventListener('mouseover', function(e) {
    if (!_pk) return; var el = e.target;
    if (el===document.body||el===document.documentElement) return;
    if (el.style&&el.style.position==='fixed'&&el.style.pointerEvents==='none') return;
    if (!_ho) _ho=co('hover'); po(_ho,el);
    if (!_ib) _ib=cb(); var r=el.getBoundingClientRect();
    _ib.textContent=el.tagName.toLowerCase()+(el.className&&typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/)[0]:'');
    _ib.style.left=r.left+'px'; _ib.style.top=(r.top-24)+'px'; _ib.style.display='block';
  });
  document.addEventListener('mouseout', function() {
    if (_ho){_ho.style.width='0';_ho.style.height='0';} if (_ib) _ib.style.display='none';
  });
  document.addEventListener('click', function(e) {
    if (!_pk) return; var el = e.target;
    if (el===document.body||el===document.documentElement) return;
    if (el.style&&el.style.position==='fixed'&&el.style.pointerEvents==='none') return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (!_so) _so=co('selected'); po(_so,el);
    var info = gi(el); window.__lf_selected = info; _emit(info);
  }, true);
  document.addEventListener('keydown', function(e) {
    if (e.key==='Escape') {
      if (_so){_so.style.width='0';_so.style.height='0';}
      window.__lf_selected=null; _emit({action:'element-deselected'});
    }
  });
  document.addEventListener('click', function(e) {
    if (e.target===document.body||e.target===document.documentElement) {
      if (_so){_so.style.width='0';_so.style.height='0';}
      window.__lf_selected=null; _emit({action:'element-deselected'});
    }
  });
  var oc={log:console.log,warn:console.warn,error:console.error};
  ['log','warn','error'].forEach(function(lv){
    console[lv]=function(){oc[lv].apply(console,arguments);
      try{var a=Array.from(arguments).map(function(x){try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}});
      _emit({action:'console',level:lv,content:a.join(' '),timestamp:Date.now()})}catch(e){}
    };
  });
  _emit({action:'preview-ready'});
})();
<\/script>
`
}


class PreviewServer {
  constructor() { this._server = null; this._port = 0; this._projectPath = null; this._effects = ''; this._tailwind = false; }
  start(projectPath, options) {
    this._projectPath = projectPath; this._effects = options.effects || ''; this._tailwind = !!options.tailwind;
    return new Promise((resolve, reject) => {
      if (this._server) { this.stop().then(() => this._startServer(resolve, reject)); }
      else { this._startServer(resolve, reject); }
    });
  }
  _startServer(resolve, reject) {
    this._server = http.createServer((req, res) => this._handleRequest(req, res));
    this._server.listen(0, '127.0.0.1', () => { this._port = this._server.address().port; resolve(this._port); });
    this._server.on('error', (err) => reject(err));
  }
  stop() {
    return new Promise((resolve) => {
      if (this._server) { this._server.close(() => { this._server = null; this._port = 0; resolve(); }); }
      else resolve();
    });
  }
  getPort() { return this._port; }
  getUrl(filePath) {
    if (!this._port) return '';
    const relPath = filePath ? path.relative(this._projectPath, filePath).replace(/\\/g, '/') : '/index.html';
    return 'http://127.0.0.1:' + this._port + '/' + relPath;
  }
  setEffects(css) { this._effects = css || ''; }
  _handleRequest(req, res) {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const safePath = path.normalize(urlPath).replace(/^(\.\.?(\/|\\|$))+/, '');
    const filePath = path.join(this._projectPath, safePath);
    if (!filePath.startsWith(this._projectPath)) { res.writeHead(403); res.end('403'); return; }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        if (urlPath.endsWith('/')) { const ip = path.join(filePath, 'index.html'); if (fs.existsSync(ip)) return this._serveFile(ip, '.html', res); }
        res.writeHead(404); res.end('404'); return;
      }
      this._serveFile(filePath, path.extname(filePath).toLowerCase(), res);
    });
  }
  _serveFile(filePath, ext, res) {
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(500); res.end('500'); return; }
      const ct = CONTENT_TYPES[ext] || 'application/octet-stream';
      if (ext === '.html' || ext === '.htm') {
        let html = data.toString('utf-8');
        if (this._tailwind && html.includes('</head>')) html = html.replace('</head>', '<script src="https://cdn.tailwindcss.com"><\/script>\n</head>');
        if (this._effects && html.includes('</head>')) html = html.replace('</head>', '<style id="livefront-effects">' + this._effects + '</style>\n</head>');
        const inj = getInjectedScript();
        if (html.includes('</body>')) html = html.replace('</body>', inj + '\n</body>'); else html += inj;
        res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' });
        res.end(html);
      } else {
        res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' });
        res.end(data);
      }
    });
  }
}

let mainWindow = null, fileWatcher = null, previewServer = new PreviewServer(), previewWindows = [];
const stateFile = join(app.getPath('userData'), 'window-state.json');

function loadWindowState() { try { return JSON.parse(fs.readFileSync(stateFile, 'utf-8')); } catch { return { width: 1400, height: 900 }; } }
function saveWindowState(win) { if (!win || win.isDestroyed()) return; const b = win.getBounds(); fs.writeFileSync(stateFile, JSON.stringify({ ...b, isMaximized: win.isMaximized() })); }
function sendToRenderer(ch, ...a) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(ch, ...a); }

function createWindow() {
  const s = loadWindowState();
  mainWindow = new BrowserWindow({
    width: s.width||1400, height: s.height||900, x: s.x, y: s.y,
    minWidth: 900, minHeight: 600, frame: false, titleBarStyle: 'hidden', backgroundColor: '#0a0a0f',
    webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, webviewTag: true }
  });
  if (s.isMaximized) mainWindow.maximize();
  mainWindow.on('close', () => saveWindowState(mainWindow));
  if ((!app.isPackaged) && process.env.ELECTRON_RENDERER_URL) mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  else mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  if ((!app.isPackaged)) mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// IPC
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize(); });
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.handle('fs:read-dir', async (_e, p) => readDirTree(p));
ipcMain.handle('fs:read-dir-by-ext', async (_e, p, exts) => readDirByExt(p, Array.isArray(exts) ? exts : []));
ipcMain.handle('fs:read-file', async (_e, p) => fs.promises.readFile(p, 'utf-8'));
ipcMain.handle('fs:write-file', async (_e, p, c) => { await fs.promises.writeFile(p, c, 'utf-8'); return true; });
ipcMain.handle('fs:create-file', async (_e, p, c) => { await fs.promises.writeFile(p, c||'', 'utf-8'); return true; });
ipcMain.handle('fs:create-dir', async (_e, p) => { await fs.promises.mkdir(p, { recursive: true }); return true; });
ipcMain.handle('fs:delete-file', async (_e, p) => { await fs.promises.unlink(p); return true; });
ipcMain.handle('fs:rename', async (_e, o, n) => { await fs.promises.rename(o, n); return true; });
ipcMain.handle('fs:stat', async (_e, p) => { const s = await fs.promises.stat(p); return { isFile: s.isFile(), isDirectory: s.isDirectory(), size: s.size, mtime: s.mtimeMs }; });
ipcMain.handle('fs:exists', async (_e, p) => fs.existsSync(p));
ipcMain.handle('dialog:open-folder', async () => { console.log('[Main] dialog:open-folder called'); const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }); console.log('[Main] dialog result:', r.canceled ? 'canceled' : r.filePaths[0]); return r.canceled ? null : r.filePaths[0]; });
ipcMain.handle('dialog:open-file', async (_e, f) => { const r = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: f||[] }); return r.canceled ? null : r.filePaths[0]; });
ipcMain.handle('dialog:save-file', async (_e, f) => { const r = await dialog.showSaveDialog(mainWindow, { filters: f||[{name:'HTML',extensions:['html','htm']},{name:'CSS',extensions:['css']},{name:'JS',extensions:['js','ts']},{name:'All',extensions:['*']}] }); return r.canceled ? null : r.filePath; });
ipcMain.handle('dialog:confirm', async (_e, m) => { const r = await dialog.showMessageBox(mainWindow, { type:'question', buttons:['纭','鍙栨秷'], message: m }); return r.response === 0; });
ipcMain.handle('shell:open-external', (_e, u) => shell.openExternal(u));
ipcMain.handle('shell:show-item', (_e, p) => shell.showItemInFolder(p));
ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:get-path', (_e, n) => app.getPath(n));

// Preview IPC
ipcMain.handle('preview:start', async (_e, p, o) => { try { const port = await previewServer.start(p, o||{}); return { port, url: 'http://127.0.0.1:'+port+'/' }; } catch(e) { return { error: e.message }; } });
ipcMain.handle('preview:stop', async () => { await previewServer.stop(); return true; });
ipcMain.handle('preview:url', (_e, p) => previewServer.getUrl(p));
ipcMain.handle('preview:port', () => previewServer.getPort());
ipcMain.handle('preview:set-effects', (_e, c) => { previewServer.setEffects(c); return true; });
ipcMain.handle('preview:open-external-window', (_e, u) => {
  const w = new BrowserWindow({ width:1280, height:800, title:'LiveFront Preview', backgroundColor:'#ffffff', webPreferences:{nodeIntegration:false,contextIsolation:true} });
  w.loadURL(u||'http://127.0.0.1:'+previewServer.getPort()+'/');
  previewWindows.push(w); w.on('closed', () => { previewWindows = previewWindows.filter(x=>x!==w); }); return true;
});
ipcMain.handle('preview:refresh-external', () => { previewWindows.forEach(w => { if(!w.isDestroyed()) w.webContents.reloadIgnoringCache(); }); return true; });

// Watch
ipcMain.handle('fs:watch', (_e, p) => {
  if (fileWatcher) fileWatcher.close();
  fileWatcher = chokidar.watch(p, { ignored:[/[/\\]\.git[/\\]/,/[/\\]node_modules[/\\]/,/\.livefront/,/[/\\]dist[/\\]/,/[/\\]out[/\\]/], persistent:true, ignoreInitial:true, depth:10 });
  fileWatcher.on('change', (f) => { sendToRenderer('fs:file-changed', f); previewWindows.forEach(w=>{if(!w.isDestroyed())w.webContents.reloadIgnoringCache();}); });
  fileWatcher.on('add', (f) => sendToRenderer('fs:file-added', f));
  fileWatcher.on('unlink', (f) => sendToRenderer('fs:file-removed', f));
  fileWatcher.on('addDir', (d) => sendToRenderer('fs:dir-added', d));
  fileWatcher.on('unlinkDir', (d) => sendToRenderer('fs:dir-removed', d));
  return true;
});
ipcMain.handle('fs:unwatch', () => { if (fileWatcher) { fileWatcher.close(); fileWatcher=null; } return true; });

const IGNORE = new Set(['.git','node_modules','.DS_Store','.livefront','dist','out','Thumbs.db']);
function readDirByExt(rootDir, extensions) {
  const extSet = new Set((extensions || []).map(e => (e || '').replace(/^\./, '').toLowerCase()));
  const results = [];

  const walk = (currentDir, depth) => {
    if (depth > 10) return;
    let entries;
    try { entries = fs.readdirSync(currentDir, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
      if (IGNORE.has(entry.name)) continue;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).replace(/^\./, '').toLowerCase();
      if (extSet.size === 0 || extSet.has(ext)) {
        results.push(fullPath);
      }
    }
  };

  walk(rootDir, 0);
  return results;
}

function readDirTree(dp, depth) {
  if ((depth||0)>10) return [];
  let entries; try { entries = fs.readdirSync(dp, {withFileTypes:true}); } catch { return []; }
  entries.sort((a,b) => { if(a.isDirectory()!==b.isDirectory()) return a.isDirectory()?-1:1; return a.name.localeCompare(b.name); });
  return entries.filter(e=>!IGNORE.has(e.name)).map(e => {
    const fp = path.join(dp, e.name);
    return e.isDirectory() ? { name:e.name, path:fp, type:'directory', children:readDirTree(fp,(depth||0)+1) } : { name:e.name, path:fp, type:'file' };
  });
}


// ============ AI 浠ｇ悊 ============
// No preset AI endpoints - user provides full URL as provider

ipcMain.handle('ai:request', async (_e, { provider, apiKey, model, messages, maxTokens }) => {
  const endpoint = provider;
  try {
    const headers = { 'Content-Type': 'application/json' };
    let body;

    if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      const systemMsg = messages.find(m => m.role === 'system');
      const userMsgs = messages.filter(m => m.role !== 'system');
      body = JSON.stringify({
        model, max_tokens: maxTokens || 4096,
        system: systemMsg?.content || '',
        messages: userMsgs
      });
    } else {
      headers['Authorization'] = 'Bearer ' + apiKey;
      body = JSON.stringify({ model, messages, max_tokens: maxTokens || 4096, temperature: 0.7 });
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body });
    if (!resp.ok) {
      const errText = await resp.text();
      return { error: 'API error ' + resp.status + ': ' + errText.substring(0, 200) };
    }
    const data = await resp.json();

    if (provider === 'claude') {
      return { content: data.content?.[0]?.text || '', usage: data.usage };
    }
    return { content: data.choices?.[0]?.message?.content || '', usage: data.usage };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('ai:stream-request', async (_e, { provider, apiKey, model, messages, maxTokens }) => {
  const endpoint = provider;
  try {
    const headers = { 'Content-Type': 'application/json' };
    let body;

    if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      const systemMsg = messages.find(m => m.role === 'system');
      const userMsgs = messages.filter(m => m.role !== 'system');
      body = JSON.stringify({
        model, max_tokens: maxTokens || 4096, stream: true,
        system: systemMsg?.content || '',
        messages: userMsgs
      });
    } else {
      headers['Authorization'] = 'Bearer ' + apiKey;
      body = JSON.stringify({ model, messages, max_tokens: maxTokens || 4096, temperature: 0.7, stream: true });
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body });
    if (!resp.ok) {
      const errText = await resp.text();
      return { error: 'API error ' + resp.status + ': ' + errText.substring(0, 200) };
    }

    let fullContent = '';
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          let chunk = '';
          if (provider === 'claude') {
            if (parsed.type === 'content_block_delta') chunk = parsed.delta?.text || '';
          } else {
            chunk = parsed.choices?.[0]?.delta?.content || '';
          }
          if (chunk) {
            fullContent += chunk;
            sendToRenderer('ai:stream-chunk', { chunk });
          }
        } catch {}
      }
    }

    sendToRenderer('ai:stream-end', { fullResponse: fullContent });
    return { content: fullContent };
  } catch (e) {
    return { error: e.message };
  }
});


// ============ Terminal IPC ============
let pty = null;
try {
  pty = require('node-pty');
} catch (e) {
  console.warn('[Main] node-pty init failed, terminal unavailable:', e.message);
}

const terminals = new Map();

if (pty) {
  ipcMain.handle('terminal:create', (_e, { cwd } = {}) => {
    try {
      const shell = process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
      const term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: cwd || process.env.HOME || process.env.USERPROFILE,
      });
      const termId = 'term_' + Date.now();
      term.onData((data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:data', { termId, data });
        }
      });
      term.onExit(({ exitCode }) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:exit', { termId, exitCode });
        }
        terminals.delete(termId);
      });
      terminals.set(termId, term);
      return { termId };
    } catch (e) {
      console.error('[Main] createTerminal failed:', e);
      return { error: e.message };
    }
  });

  ipcMain.on('terminal:write', (_e, { termId, data }) => {
    const term = terminals.get(termId);
    if (term) term.write(data);
  });

  ipcMain.on('terminal:resize', (_e, { termId, cols, rows }) => {
    const term = terminals.get(termId);
    if (term) {
      try { term.resize(cols, rows); } catch (e) { /* ignore */ }
    }
  });

  ipcMain.on('terminal:kill', (_e, termId) => {
    const term = terminals.get(termId);
    if (term) {
      try { term.kill(); } catch (e) { /* ignore */ }
      terminals.delete(termId);
    }
  });
} else {
  ipcMain.handle('terminal:create', () => {
    return { error: 'node-pty not installed. Run: npm install node-pty' };
  });
}


// ============ Terminal IPC ============
function gitFor(projectPath) {
  return simpleGit(projectPath);
}

ipcMain.handle('git:init', async (_e, { projectPath }) => {
  try {
    const git = gitFor(projectPath);
    const status = await git.status();
    return { isGitRepo: true, currentBranch: status.current || null };
  } catch {
    return { isGitRepo: false, currentBranch: null };
  }
});

ipcMain.handle('git:status', async (_e, { projectPath }) => {
  const git = gitFor(projectPath);
  const status = await git.status();
  return {
    currentBranch: status.current || "",
    files: status.files.map(f => ({
      path: f.path,
      index: f.index || "",
      workingDir: f.working_dir || ""
    })),
    ahead: status.ahead || 0,
    behind: status.behind || 0
  };
});

ipcMain.handle('git:log', async (_e, { projectPath, count }) => {
  const git = gitFor(projectPath);
  const log = await git.log({ maxCount: count || 20 });
  return {
    commits: log.all.map(c => ({
      hash: c.hash,
      message: c.message,
      author: c.author_name,
      date: c.date
    }))
  };
});

ipcMain.handle('git:stage', async (_e, { projectPath, files }) => {
  const git = gitFor(projectPath);
  await git.add(files);
  return { success: true };
});

ipcMain.handle('git:unstage', async (_e, { projectPath, files }) => {
  const git = gitFor(projectPath);
  await git.reset(["--", ...files]);
  return { success: true };
});

ipcMain.handle('git:commit', async (_e, { projectPath, message }) => {
  const git = gitFor(projectPath);
  const result = await git.commit(message);
  return { success: true, hash: result.commit };
});

ipcMain.handle('git:branches', async (_e, { projectPath }) => {
  const git = gitFor(projectPath);
  const branch = await git.branchLocal();
  return { branches: branch.all, current: branch.current };
});

ipcMain.handle('git:checkout', async (_e, { projectPath, branch }) => {
  const git = gitFor(projectPath);
  await git.checkout(branch);
  return { success: true };
});

ipcMain.handle('git:create-branch', async (_e, { projectPath, name }) => {
  const git = gitFor(projectPath);
  await git.checkoutLocalBranch(name);
  return { success: true };
});

ipcMain.handle('git:diff', async (_e, { projectPath, file, staged }) => {
  const git = gitFor(projectPath);
  const opts = staged ? ['--cached', '--', file] : ['--', file];
  const diff = await git.diff(opts);
  return { diff };
});

ipcMain.handle('git:discard', async (_e, { projectPath, file }) => {
  const git = gitFor(projectPath);
  const status = await git.status();
  const entry = status.files.find(f => f.path === file);
  if (entry && entry.index !== '?' && entry.index !== '') {
    await git.checkout(['--', file]);
  } else {
    const fullPath = path.join(projectPath, file);
    try { await fs.promises.rm(fullPath, { recursive: true, force: true }); } catch {}
  }
  return { success: true };
});

// ============ Project Export ZIP ============
ipcMain.handle('project:export-zip', async (_e, { projectPath, outputPath }) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    const EXCLUDE = ['node_modules', '.git', '.livefront', '.DS_Store', 'dist', 'build'];

    output.on('close', () => resolve({ success: true, size: archive.pointer() }));
    archive.on('error', (err) => reject({ error: err.message }));
    archive.pipe(output);

    // Walk the directory and add files, excluding unwanted dirs
    function addDir(dirPath, basePath) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (EXCLUDE.includes(entry.name)) continue;
        const fullPath = path.join(dirPath, entry.name);
        const archivePath = basePath ? basePath + '/' + entry.name : entry.name;
        if (entry.isDirectory()) {
          addDir(fullPath, archivePath);
        } else {
          archive.file(fullPath, { name: archivePath });
        }
      }
    }

    addDir(projectPath, '');
    archive.finalize();
  });
});
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length===0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform!=='darwin') app.quit(); });



