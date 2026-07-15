const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const indexPath = path.resolve('src/renderer/index.html');
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 800, height: 600, show: false, webPreferences: { contextIsolation: true } });
  win.webContents.on('render-process-gone', (_e, d) => console.error('render-process-gone', d));
  win.webContents.on('did-fail-load', (_e, code, desc) => console.error('did-fail-load', code, desc));
  win.webContents.on('console-message', (_e, level, msg, line, sourceId) => console.log(`console[${level}] ${msg} (${sourceId}:${line})`));
  console.log('loading', indexPath, 'exists=', fs.existsSync(indexPath));
  win.loadFile(indexPath);
  setTimeout(() => { console.log('timeout quit'); app.quit(); }, 5000);
}).catch(err => { console.error(err); app.exit(1); });
