/* LiveFront 鍏变韩鏈嶅姟 */
window.LiveFront = window.LiveFront || {};

LiveFront.Services = {
  fileSystem: {
    readDir(p) { return LiveFront.ipc.invoke('fs:read-dir', p); },
    readFile(p) { return LiveFront.ipc.invoke('fs:read-file', p); },
    writeFile(p, c) { return LiveFront.ipc.invoke('fs:write-file', p, c); },
    createFile(p, c) { return LiveFront.ipc.invoke('fs:create-file', p, c); },
    createDir(p) { return LiveFront.ipc.invoke('fs:create-dir', p); },
    deleteFile(p) { return LiveFront.ipc.invoke('fs:delete-file', p); },
    rename(o, n) { return LiveFront.ipc.invoke('fs:rename', o, n); },
    stat(p) { return LiveFront.ipc.invoke('fs:stat', p); },
    exists(p) { return LiveFront.ipc.invoke('fs:exists', p); },
    watch(d) { return LiveFront.ipc.invoke('fs:watch', d); },
    unwatch() { return LiveFront.ipc.invoke('fs:unwatch'); },
    onFileChanged(cb) { if (window.api?.fs?.onFileChanged) return window.api.fs.onFileChanged(cb); },
    onFileAdded(cb) { if (window.api?.fs?.onFileAdded) return window.api.fs.onFileAdded(cb); },
    onFileRemoved(cb) { if (window.api?.fs?.onFileRemoved) return window.api.fs.onFileRemoved(cb); }
  },
  dialog: {
    openFolder() { return LiveFront.ipc.invoke('dialog:open-folder'); },
    openFile(f) { return LiveFront.ipc.invoke('dialog:open-file', f); },
    saveFile(f) { return LiveFront.ipc.invoke('dialog:save-file', f); },
    confirm(m) { return LiveFront.ipc.invoke('dialog:confirm', m); }
  },
  preview: {
    start(projectPath, options) { return LiveFront.ipc.invoke('preview:start', projectPath, options); },
    stop() { return LiveFront.ipc.invoke('preview:stop'); },
    getUrl(filePath) { return LiveFront.ipc.invoke('preview:url', filePath); },
    getPort() { return LiveFront.ipc.invoke('preview:port'); },
    setEffects(css) { return LiveFront.ipc.invoke('preview:set-effects', css); },
    openExternalWindow(url) { return LiveFront.ipc.invoke('preview:open-external-window', url); },
    refreshExternal() { return LiveFront.ipc.invoke('preview:refresh-external'); }
  },

  terminal: {
    async create(opts) {
      const result = await window.api.terminal.create(opts)
      if (result.error) throw new Error(result.error)
      return result
    },
    write(termId, data) {
      window.api.terminal.write({ termId, data })
    },
    resize(termId, cols, rows) {
      window.api.terminal.resize({ termId, cols, rows })
    },
    kill(termId) {
      window.api.terminal.kill(termId)
    },
    onData(callback) {
      return window.api.terminal.onData(callback)
    },
    onExit(callback) {
      return window.api.terminal.onExit(callback)
    }
  },
  ai: {
    request(params) { return LiveFront.ipc.invoke('ai:request', params); },
    streamRequest(params) { return LiveFront.ipc.invoke('ai:stream-request', params); },
    cancelStream(termId) { if (window.api?.ai?.cancelStream) window.api.ai.cancelStream(termId); },
    onStreamChunk(cb) { if (window.api?.ai?.onStreamChunk) return window.api.ai.onStreamChunk(cb); },
    onStreamEnd(cb) { if (window.api?.ai?.onStreamEnd) return window.api.ai.onStreamEnd(cb); },
    onStreamError(cb) { if (window.api?.ai?.onStreamError) return window.api.ai.onStreamError(cb); }
  },
  
  project: {
    async exportZip(projectPath, outputPath) {
      return window.api.project.exportZip({ projectPath, outputPath });
    },
    async detectBuildTool(projectPath) {
      return LiveFront.BuildManager.detectBuildTool(projectPath);
    }
  },

  app: {
    getVersion() { return LiveFront.ipc.invoke('app:get-version'); },
    getRecentProjects() { return LiveFront.Storage.get('recentProjects', []); },
    addRecentProject(p) {
      let r = LiveFront.Storage.get('recentProjects', []);
      r = r.filter(x => x !== p);
      r.unshift(p);
      if (r.length > 10) r = r.slice(0, 10);
      LiveFront.Storage.set('recentProjects', r);
    }
  },
  mcp: {
    async startServer(port) {
      return window.api.mcp.startServer(port);
    },
    async stopServer() {
      return window.api.mcp.stopServer();
    },
    async getTools() {
      return window.api.mcp.getTools();
    },
    async callTool(tool, args) {
      return window.api.mcp.callTool(tool, args);
    },
    async getConfig() {
      return window.api.mcp.getConfig();
    },
    async connectServer(config) {
      return window.api.mcp.connectServer(config);
    },
    async disconnectServer(name) {
      return window.api.mcp.disconnectServer(name);
    },
    async listConnectedServers() {
      return window.api.mcp.listConnectedServers();
    },
    async listRemoteTools(name) {
      try {
        return await window.api.mcp.listRemoteTools(name);
      } catch (error) {
        const wrapped = new Error(error?.message || '刷新 MCP 工具失败');
        wrapped.code = error?.code || 'MCP_LIST_FAILED';
        wrapped.original = error;
        throw wrapped;
      }
    },
    async callRemoteTool(serverName, tool, args) {
      try {
        return await window.api.mcp.callRemoteTool(serverName, tool, args);
      } catch (error) {
        const code = error?.code || 'MCP_CALL_FAILED';
        const message = error?.message || 'MCP 调用失败';
        const wrapped = new Error(message);
        wrapped.code = code;
        wrapped.original = error;
        throw wrapped;
      }
    },
    async importFromClaudeDesktop(configPath) {
      return window.api.mcp.importFromClaudeDesktop(configPath);
    },
    async importFromCursor(configPath) {
      return window.api.mcp.importFromCursor(configPath);
    },
    onClientsChanged(cb) {
      if (window.api?.mcp?.onClientsChanged) return window.api.mcp.onClientsChanged(cb);
    }
  },
  agent: {
    async scan() {
      return window.api.agent.scan();
    },
    async getConfig(name) {
      return window.api.agent.getConfig(name);
    },
    async saveConfig(name, config) {
      return window.api.agent.saveConfig(name, config);
    }
  }
};

LiveFront.state = {
  currentProjectPath: null,
  projectTree: null,
  openFiles: [],
  activeFile: null,
  fileContents: {},
  fileDirty: {},
  selectedElement: null
};

LiveFront.Services.framework = {
  async detect(projectPath) {
    if (!LiveFront.FrameworkDetector?.detect) {
      return { framework: "html", hasNodeModules: false, hasBuildScript: false }
    }
    return LiveFront.FrameworkDetector.detect(projectPath)
  }
}


LiveFront.Services.codeBridge = {
  async importFromClipboard() {
    const text = await navigator.clipboard.readText()
    if (!text) return { imported: false, reason: 'clipboard_empty' }
    const guess = guessFilenameFromCode(text)
    const projectPath = LiveFront.state.currentProjectPath
    if (!projectPath) return { imported: false, reason: 'no_project' }
    const filePath = await LiveFront.Services.fileSystem.createFile(projectPath + '/' + guess.filename, text)
    return { imported: true, filePath, filename: guess.filename, language: guess.language }
  },
  async importFromFolder(folderPath) {
    if (!folderPath) return { imported: false, reason: 'no_folder' }
    const exists = await LiveFront.Services.fileSystem.exists(folderPath)
    if (!exists) return { imported: false, reason: 'folder_missing' }
    return { imported: true, folderPath }
  },
  async importFromAPI(code, filename, source, project) {
    if (!code) return { imported: false, reason: 'empty_code' }
    const projectPath = project || LiveFront.state.currentProjectPath
    if (!projectPath) return { imported: false, reason: 'no_project' }
    const safeName = filename || guessFilenameFromCode(code).filename
    const filePath = await LiveFront.Services.fileSystem.createFile(projectPath + '/' + safeName, code)
    return { imported: true, filePath, filename: safeName, source: source || 'api' }
  },
  async importFromDragDrop(fileList) {
    const results = []
    for (const file of fileList || []) {
      const text = await file.text()
      const projectPath = LiveFront.state.currentProjectPath
      if (!projectPath) {
        results.push({ filename: file.name, imported: false, reason: 'no_project' })
        continue
      }
      const filePath = await LiveFront.Services.fileSystem.createFile(projectPath + '/' + file.name, text)
      results.push({ filename: file.name, imported: true, filePath })
    }
    return results
  }
}

function guessFilenameFromCode(code) {
  const trimmed = (code || '').trim()
  if (trimmed.startsWith('<')) return { filename: 'clipboard.html', language: 'html' }
  if (trimmed.includes('export default') || trimmed.includes('import ') || trimmed.includes('function ')) return { filename: 'clipboard.js', language: 'javascript' }
  return { filename: 'clipboard.txt', language: 'plaintext' }
}

LiveFront.Services.bridge = {
  sendToExtension(summary, target) {
    if (window.api?.bridge?.sendToExtension) {
      return window.api.bridge.sendToExtension(summary, target);
    }
    return Promise.resolve({ success: false, error: 'bridge not available' });
  },
  isConnected() {
    if (window.api?.bridge?.isConnected) {
      return window.api.bridge.isConnected();
    }
    return Promise.resolve({ connected: false });
  }
};
