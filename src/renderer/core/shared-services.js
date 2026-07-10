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

