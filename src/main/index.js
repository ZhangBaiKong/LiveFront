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


// ============ Core Services ============
let mainWindow = null;
let previewWindows = [];
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
      webSecurity: false
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

// ============ Ready ============
app.whenReady().then(async () => {
  createWindow();

  // Auto-start API service (port 9527)
  try {
    startLocalImportServer();
  } catch (e) {
    console.warn("[Main] Failed to start Local Import API:", e?.message || e);
  }

  // Auto-start MCP Server (default port 9528)
  try {
    await mcpServer.start(9528);
  } catch (e) {
    console.warn("[Main] Failed to start MCP Server:", e?.message || e);
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
          if (!code) { res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify({ success: false, message: '缺少 code 字段' })); return; }
          if (!project) { res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify({ success: false, message: '未找到关联项目路径' })); return; }
          const target = path.join(project, filename);
          await fs.promises.writeFile(target, code, 'utf-8');
          sendToRenderer('code:api-imported', { filePath: target, filename, source });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, message: '代码已导入', filePath: target }));
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

  server.listen(port, '127.0.0.1', () => {
    console.log('[Main] Local import API started at http://localhost:' + port + '/api/import');
  });
}
