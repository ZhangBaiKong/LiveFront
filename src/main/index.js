const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { join } = require('path');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const http = require('http');
const simpleGit = require('simple-git');
const archiver = require('archiver');
const WebSocket = require('ws');
const McpClientManager = require('./mcp-client');
const LiveFrontMcpServer = require('./mcp-server');
const AgentScanner = require('./agent-scanner');

// ============ Safe Logging & Crash Guard ============
const _origConsole = { log: console.log, warn: console.warn, error: console.error };
const isDev = !app.isPackaged;
function safeLog(level, ...args) {
  try { _origConsole[level]('[Main]', ...args); } catch (_) {}
}
console.log = (...a) => { if (isDev) safeLog('log', ...a); };
console.warn = (...a) => { if (isDev) safeLog('warn', ...a); };
console.error = (...a) => { safeLog('error', ...a); };

process.on('uncaughtException', (err) => {
  if (err && err.code === 'EPIPE') return;
  safeLog('error', 'uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  safeLog('error', 'unhandledRejection:', reason);
});



// ============ Core Services ============
let mainWindow = null;
let previewWindows = [];
const PreviewServer = require('./preview-server');
const previewServer = new PreviewServer();
let pty = null;
try { pty = require('node-pty'); } catch (_) { /* optional */ }

let livefrontBridges = [];
let fileWatcher = null;
let currentProjectPath = '';
const stateFile = join(app.getPath('userData'), 'window-state.json');

const mcpClientManager = new McpClientManager({
  sendToRenderer: (channel, ...args) => {
    try { sendToRenderer(channel, ...args); } catch {}
  }
});

const mcpServer = new LiveFrontMcpServer({
  getMainWindow: () => mainWindow,
  getProjectPath: () => currentProjectPath,
  callMcpClientTool: async (...args) => mcpClientManager.callTool(...args)
});

function loadWindowState() {
  try { return JSON.parse(fs.readFileSync(stateFile, 'utf-8')); } catch { return { width: 1400, height: 900 }; }
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  const b = win.getBounds();
  fs.writeFileSync(stateFile, JSON.stringify({ ...b, isMaximized: win.isMaximized() }));
}

function sendToRenderer(ch, ...a) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(ch, ...a);
}

function createWindow() {
  const s = loadWindowState();
  mainWindow = new BrowserWindow({
    width: s.width || 1400,
    height: s.height || 900,
    x: s.x,
    y: s.y,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'LiveFront',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      webviewTag: true
    }
  });

  if (s.isMaximized) mainWindow.maximize();
  mainWindow.on('close', () => saveWindowState(mainWindow));
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  return mainWindow;
}

function loadMainSettings() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'livefront-settings.json');
    if (!fs.existsSync(settingsPath)) return null;
    return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch {
    return null;
  }
}

// ============ Watcher ============
ipcMain.handle('fs:watch', (_e, p) => {
  if (fileWatcher) fileWatcher.close();
  currentProjectPath = p;
  fileWatcher = chokidar.watch(p, {
    ignored: [/[/\\]\.git[/\\]/, /[/\\]node_modules[/\\]/, /\.livefront/, /[/\\]dist[/\\]/, /[/\\]out[/\\]/],
    persistent: true,
    ignoreInitial: true,
    depth: 10
  });
  fileWatcher.on('change', (f) => {
    sendToRenderer('fs:file-changed', f);
    previewWindows.forEach((w) => { if (!w.isDestroyed()) w.webContents.reloadIgnoringCache(); });
  });
  fileWatcher.on('add', (f) => sendToRenderer('fs:file-added', f));
  fileWatcher.on('unlink', (f) => sendToRenderer('fs:file-removed', f));
  fileWatcher.on('addDir', (d) => sendToRenderer('fs:dir-added', d));
  fileWatcher.on('unlinkDir', (d) => sendToRenderer('fs:dir-removed', d));
  return true;
});
ipcMain.handle('fs:unwatch', () => { if (fileWatcher) { fileWatcher.close(); fileWatcher = null; } return true; });

const IGNORE = new Set(['.git', 'node_modules', '.DS_Store', '.livefront', 'dist', 'out', 'Thumbs.db']);
function readDirByExt(rootDir, extensions) {
  const extSet = new Set((extensions || []).map((e) => (e || '').replace(/^\./, '').toLowerCase()));
  const results = [];
  const walk = (currentDir, depth) => {
    if (depth > 10) return;
    let entries;
    try { entries = fs.readdirSync(currentDir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (IGNORE.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) { walk(fullPath, depth + 1); continue; }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).replace(/^\./, '').toLowerCase();
      if (extSet.size === 0 || extSet.has(ext)) results.push(fullPath);
    }
  };
  walk(rootDir, 0);
  return results;
}

function readDirTree(dp, depth) {
  if ((depth || 0) > 10) return [];
  let entries;
  try { entries = fs.readdirSync(dp, { withFileTypes: true }); } catch { return []; }
  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return entries.filter((e) => !IGNORE.has(e.name)).map((e) => {
    const fp = path.join(dp, e.name);
    return e.isDirectory()
      ? { name: e.name, path: fp, type: 'directory', children: readDirTree(fp, (depth || 0) + 1) }
      : { name: e.name, path: fp, type: 'file' };
  });
}

// ============ Agent & MCP ============
ipcMain.handle('agent:scan', async () => AgentScanner.scanAgents());
ipcMain.handle('agent:get-config', async (_event, agentName) => AgentScanner.getAgentConfig(agentName));
ipcMain.handle('agent:save-config', async (_event, { agentName, config }) => AgentScanner.saveAgentConfig(agentName, config));
ipcMain.handle('mcp:start-server', async (_event, port) => mcpServer.start(port));
ipcMain.handle('mcp:stop-server', async () => mcpServer.stop());
ipcMain.handle('mcp:get-tools', async () => mcpServer.getTools());
ipcMain.handle('mcp:call-tool', async (_event, { tool, args }) => mcpServer.callTool(tool, args));
ipcMain.handle('mcp:get-config', async () => mcpServer.buildExportConfig());
ipcMain.handle('mcp:connect-server', async (_event, config) => mcpClientManager.connectServer(config));
ipcMain.handle('mcp:disconnect-server', async (_event, name) => mcpClientManager.disconnectServer(name));
ipcMain.handle('mcp:list-connected-servers', async () => mcpClientManager.listServers());
ipcMain.handle('mcp:list-remote-tools', async (_event, name) => mcpClientManager.listTools(name));
ipcMain.handle('mcp:call-remote-tool', async (_event, { serverName, tool, args }) => mcpClientManager.callTool(serverName, tool, args));
ipcMain.handle('mcp:list-configured-servers', async () => mcpClientManager.getConfiguredServers());
ipcMain.handle('mcp:import-claude-desktop', async (_event, configPath) => mcpClientManager.importFromClaudeDesktop(configPath));
ipcMain.handle('mcp:import-cursor', async (_event, configPath) => mcpClientManager.importFromCursor(configPath));

// ============ Window ============
ipcMain.handle('window:minimize', () => { try { mainWindow?.minimize(); } catch (_) {} return true; });
ipcMain.handle('window:maximize', () => { try { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize(); } catch (_) {} return true; });
ipcMain.handle('window:close', () => { try { mainWindow?.close(); } catch (_) {} return true; });
ipcMain.handle('window:is-maximized', () => { try { return mainWindow?.isMaximized() ?? false; } catch (_) { return false; } });

// ============ FileSystem ============
ipcMain.handle('fs:read-dir', async (_e, p) => readDirTree(p));
ipcMain.handle('fs:read-file', async (_e, p) => { try { return await fs.promises.readFile(p, 'utf-8'); } catch (e) { return ''; } });
ipcMain.handle('fs:write-file', async (_e, p, c) => { await fs.promises.writeFile(p, c, 'utf-8'); return true; });
ipcMain.handle('fs:create-file', async (_e, p, c) => { await fs.promises.writeFile(p, c || '', 'utf-8'); return true; });
ipcMain.handle('fs:create-dir', async (_e, p) => { await fs.promises.mkdir(p, { recursive: true }); return true; });
ipcMain.handle('fs:delete-file', async (_e, p) => { await fs.promises.unlink(p); return true; });
ipcMain.handle('fs:rename', async (_e, o, n) => { await fs.promises.rename(o, n); return true; });
ipcMain.handle('fs:stat', async (_e, p) => { const s = await fs.promises.stat(p); return { isFile: s.isFile(), isDirectory: s.isDirectory(), size: s.size, mtime: s.mtimeMs }; });
ipcMain.handle('fs:exists', async (_e, p) => fs.existsSync(p));
ipcMain.handle('fs:read-dir-by-ext', async (_e, p, ext) => readDirByExt(p, ext));

// ============ Dialog ============
ipcMain.handle('dialog:open-folder', async () => {
  try {
    const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return r.canceled ? null : r.filePaths[0];
  } catch (_) { return null; }
});
ipcMain.handle('dialog:open-file', async (_e, f) => {
  try {
    const r = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: f || [] });
    return r.canceled ? null : r.filePaths[0];
  } catch (_) { return null; }
});
ipcMain.handle('dialog:save-file', async (_e, f) => {
  try {
    const r = await dialog.showSaveDialog(mainWindow, {
      filters: f || [{ name: 'HTML', extensions: ['html', 'htm'] }, { name: 'CSS', extensions: ['css'] }, { name: 'JS', extensions: ['js', 'ts'] }, { name: 'All', extensions: ['*'] }]
    });
    return r.canceled ? null : r.filePath;
  } catch (_) { return null; }
});
ipcMain.handle('dialog:confirm', async (_e, m) => {
  try {
    const r = await dialog.showMessageBox(mainWindow, { type: 'question', buttons: ['确认', '取消'], message: m });
    return r.response === 0;
  } catch (_) { return false; }
});

// ============ Shell & App ============
ipcMain.handle('shell:open-external', async (_e, u) => { try { await shell.openExternal(u); } catch (_) {} return true; });
ipcMain.handle('shell:show-item', async (_e, p) => { try { shell.showItemInFolder(p); } catch (_) {} return true; });
ipcMain.handle('app:get-version', () => { try { return app.getVersion(); } catch (_) { return '0.0.0'; } });
ipcMain.handle('app:get-path', (_e, n) => { try { return app.getPath(n); } catch (_) { return ''; } });

// ============ Terminal ============
let terminals = {};
let termCounter = 0;
ipcMain.handle('terminal:create', (_e, opts = {}) => {
  try {
    if (!pty) return { error: 'node-pty not installed' };
    const termId = 'term-' + (++termCounter);
    const shellName = process.platform === 'win32' ? (process.env.COMSPEC || 'powershell.exe') : (process.env.SHELL || '/bin/bash');
    const term = pty.spawn(shellName, [], { name: 'xterm-256color', cols: opts.cols || 80, rows: opts.rows || 24, cwd: opts.cwd || process.env.HOME || process.env.USERPROFILE });
    terminals[termId] = term;
    term.onData((data) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('terminal:data', { termId, data }); });
    term.onExit(() => { delete terminals[termId]; if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('terminal:exit', { termId }); });
    return { termId };
  } catch (e) { return { error: e.message }; }
});
ipcMain.on('terminal:write', (_e, { termId, data } = {}) => { try { terminals[termId]?.write(data); } catch (_) {} });
ipcMain.on('terminal:resize', (_e, { termId, cols, rows } = {}) => { try { terminals[termId]?.resize(cols, rows); } catch (_) {} });
ipcMain.on('terminal:kill', (_e, termId) => { try { terminals[termId]?.kill(); delete terminals[termId]; } catch (_) {} });

// ============ Preview ============
ipcMain.handle('preview:start', async (_e, p, o) => { try { const port = await previewServer.start(p, o || {}); return { port, url: 'http://127.0.0.1:' + port + '/' }; } catch (e) { return { error: e.message }; } });
ipcMain.handle('preview:stop', async () => { try { await previewServer.stop(); } catch (_) {} return true; });
ipcMain.handle('preview:url', (_e, p) => { try { return previewServer.getUrl(p); } catch (_) { return ''; } });
ipcMain.handle('preview:port', () => { try { return previewServer.getPort(); } catch (_) { return 0; } });
ipcMain.handle('preview:set-effects', (_e, c) => { try { previewServer.setEffects(c); } catch (_) {} return true; });
ipcMain.handle('preview:open-external-window', (_e, u) => {
  try {
    const w = new BrowserWindow({ width: 1200, height: 800, title: 'LiveFront Preview' });
    w.loadURL(u);
    previewWindows.push(w);
    w.on('closed', () => { previewWindows = previewWindows.filter(x => !x.isDestroyed()); });
  } catch (_) {}
  return true;
});
ipcMain.handle('preview:refresh-external', () => { previewWindows.forEach(w => { if (!w.isDestroyed()) w.webContents.reloadIgnoringCache(); }); return true; });

// ============ AI ============
ipcMain.handle('ai:request', async (_e, { provider, apiKey, model, messages, maxTokens } = {}) => {
  try {
    const endpoint = provider;
    const headers = { 'Content-Type': 'application/json' };
    let body;
    if (provider === 'claude' || provider?.includes('anthropic')) {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      const systemMsg = (messages || []).find(m => m.role === 'system');
      const userMsgs = (messages || []).filter(m => m.role !== 'system');
      body = JSON.stringify({ model, max_tokens: maxTokens || 4096, system: systemMsg?.content || '', messages: userMsgs });
    } else {
      headers['Authorization'] = 'Bearer ' + apiKey;
      body = JSON.stringify({ model, messages, max_tokens: maxTokens || 4096, temperature: 0.7 });
    }
    const resp = await fetch(endpoint, { method: 'POST', headers, body });
    if (!resp.ok) { const errText = await resp.text(); return { error: 'API error ' + resp.status + ': ' + errText.substring(0, 200) }; }
    const data = await resp.json();
    if (provider === 'claude' || provider?.includes('anthropic')) return { content: data.content?.[0]?.text || '', usage: data.usage };
    return { content: data.choices?.[0]?.message?.content || '', usage: data.usage };
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('ai:stream-request', async (_e, { provider, apiKey, model, messages, maxTokens } = {}) => {
  try {
    const endpoint = provider;
    const headers = { 'Content-Type': 'application/json' };
    let body;
    if (provider === 'claude' || provider?.includes('anthropic')) {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      const systemMsg = (messages || []).find(m => m.role === 'system');
      const userMsgs = (messages || []).filter(m => m.role !== 'system');
      body = JSON.stringify({ model, max_tokens: maxTokens || 4096, stream: true, system: systemMsg?.content || '', messages: userMsgs });
    } else {
      headers['Authorization'] = 'Bearer ' + apiKey;
      body = JSON.stringify({ model, messages, max_tokens: maxTokens || 4096, temperature: 0.7, stream: true });
    }
    const resp = await fetch(endpoint, { method: 'POST', headers, body });
    if (!resp.ok) { const errText = await resp.text(); return { error: 'API error ' + resp.status + ': ' + errText.substring(0, 200) }; }
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
          if (provider === 'claude' || provider?.includes('anthropic')) { if (parsed.type === 'content_block_delta') chunk = parsed.delta?.text || ''; }
          else { chunk = parsed.choices?.[0]?.delta?.content || ''; }
          if (chunk) { fullContent += chunk; sendToRenderer('ai:stream-chunk', { chunk }); }
        } catch (_) {}
      }
    }
    sendToRenderer('ai:stream-end', { fullResponse: fullContent });
    return { content: fullContent };
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('ai:send-to-cli', async (_e, params = {}) => {
  try {
    sendToRenderer('ai:stream-chunk', { chunk: params.summary || '' });
    sendToRenderer('ai:stream-end', { fullResponse: params.summary || '' });
    return { success: true };
  } catch (e) { return { error: e.message }; }
});

// ============ Git ============
ipcMain.handle('git:init', async (_e, { projectPath } = {}) => { try { await simpleGit(projectPath).init(); return { success: true }; } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:status', async (_e, { projectPath } = {}) => { try { return await simpleGit(projectPath).status(); } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:log', async (_e, { projectPath, count } = {}) => { try { return await simpleGit(projectPath).log({ maxCount: count || 30 }); } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:stage', async (_e, { projectPath, files } = {}) => { try { await simpleGit(projectPath).add(files || []); return { success: true }; } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:unstage', async (_e, { projectPath, files } = {}) => { try { await simpleGit(projectPath).reset(['HEAD', ...files]); return { success: true }; } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:commit', async (_e, { projectPath, message } = {}) => { try { return await simpleGit(projectPath).commit(message || 'update'); } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:branches', async (_e, { projectPath } = {}) => { try { return await simpleGit(projectPath).branchLocal(); } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:checkout', async (_e, { projectPath, branch } = {}) => { try { await simpleGit(projectPath).checkout(branch); return { success: true }; } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:create-branch', async (_e, { projectPath, name } = {}) => { try { await simpleGit(projectPath).checkoutLocalBranch(name); return { success: true }; } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:diff', async (_e, { projectPath, file, staged } = {}) => { try { const args = staged ? ['--cached'] : []; if (file) args.push('--', file); return await simpleGit(projectPath).diff(args); } catch (e) { return { error: e.message }; } });
ipcMain.handle('git:discard', async (_e, { projectPath, file } = {}) => { try { await simpleGit(projectPath).checkout(['--', file]); return { success: true }; } catch (e) { return { error: e.message }; } });

// ============ Project ============
ipcMain.handle('project:export-zip', async (_e, { projectPath, outputPath } = {}) => {
  try {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.glob('**/*', { cwd: projectPath, ignore: ['node_modules/**', '.git/**', 'dist/**', 'out/**', '.livefront/**'] });
    await archive.finalize();
    return { success: true };
  } catch (e) { return { error: e.message }; }
});

// ============ Bridge ============
ipcMain.handle('bridge:send-to-extension', (_e, data) => {
  try {
    livefrontBridges.forEach(ws => { if (ws.readyState === 1) ws.send(JSON.stringify(data)); });
    return { success: livefrontBridges.length > 0 };
  } catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle('bridge:is-connected', () => ({ connected: livefrontBridges.length > 0 }));

// ============ Ready ============
app.whenReady().then(async () => {
  createWindow();

  // Auto-start API service (port 9527)
  try {
    startLocalImportServer();
  } catch (e) {
    console.warn("[Main] Failed to start Local Import API:", e?.message || e);
  }

  // Auto-start MCP Server (default port 9528, fallback 9530)
  try {
    const mcpResult = await mcpServer.start(9528);
    console.log('[Main] MCP Server started on port', mcpResult.port);
  } catch (e) {
    console.warn('[Main] MCP Server port 9528 failed (' + (e?.message || e) + '), trying 9530...');
    try {
      const mcpResult = await mcpServer.start(9530);
      console.log('[Main] MCP Server started on fallback port', mcpResult.port);
    } catch (e2) {
      console.warn('[Main] Failed to start MCP Server:', e2?.message || e2);
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', async () => {
  try { await mcpServer.stop(); } catch {}
  for (const server of mcpClientManager.listServers()) {
    try { await mcpClientManager.disconnectServer(server.name); } catch {}
  }
  try { if (fileWatcher) fileWatcher.close(); } catch {}
});

function startLocalImportServer() {
  const store = loadMainSettings();
  const port = store?.codeSources?.apiPort || 9527;
  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
      res.end();
      return;
    }
    if (req.method === 'GET' && req.url === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ running: true, version: app.getVersion() }));
      return;
    }
    if (req.method === 'POST' && req.url === '/api/import') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const code = payload.code || '';
          const filename = payload.filename || 'imported-file.html';
          const source = payload.source || 'api';
          const project = payload.project || loadMainSettings()?.lastProjectPath || '';
          if (!code) { res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify({ success: false, message: 'Missing code field' })); return; }
          if (!project) { res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify({ success: false, message: 'No associated project found' })); return; }
          const target = path.join(project, filename);
          await fs.promises.writeFile(target, code, 'utf-8');
          sendToRenderer('code:api-imported', { filePath: target, filename, source });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, message: 'Code imported', filePath: target }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, message: error.message }));
        }
      });
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ success: false, message: 'not found' }));
  });

  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    livefrontBridges.push(ws);
    ws.on('close', () => {
      const index = livefrontBridges.indexOf(ws);
      if (index > -1) livefrontBridges.splice(index, 1);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = port + 2;
      console.warn('[Main] Port ' + port + ' in use, trying ' + fallbackPort);
      const retryServer = server.listen(fallbackPort, '127.0.0.1');
      retryServer.on('error', (e) => { console.error('[Main] Local import API failed:', e.message); });
      retryServer.once('listening', () => {
        console.log('[Main] Local import API started at http://localhost:' + fallbackPort + '/api/import');
      });
    } else {
      console.error('[Main] Local import API error:', err.message);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log('[Main] Local import API started at http://localhost:' + port + '/api/import');
  });
}

