const { contextBridge, ipcRenderer } = require('electron')
// electronAPI removed - not needed


const api = {
  terminal: {
    create: (opts) => ipcRenderer.invoke('terminal:create', opts),
    write: (data) => ipcRenderer.send('terminal:write', data),
    resize: (opts) => ipcRenderer.send('terminal:resize', opts),
    kill: (termId) => ipcRenderer.send('terminal:kill', termId),
    onData: (callback) => {
      const handler = (_e, data) => callback(data)
      ipcRenderer.on('terminal:data', handler)
      return () => ipcRenderer.removeListener('terminal:data', handler)
    },
    onExit: (callback) => {
      const handler = (_e, data) => callback(data)
      ipcRenderer.on('terminal:exit', handler)
      return () => ipcRenderer.removeListener('terminal:exit', handler)
    }
  },

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized')
  },
  fs: {
    readDir: (path) => ipcRenderer.invoke('fs:read-dir', path),
    readDirByExt: (path, extensions) => ipcRenderer.invoke('fs:read-dir-by-ext', path, extensions),
    readFile: (path) => ipcRenderer.invoke('fs:read-file', path),
    writeFile: (path, content) => ipcRenderer.invoke('fs:write-file', path, content),
    createFile: (path, content) => ipcRenderer.invoke('fs:create-file', path, content),
    createDir: (path) => ipcRenderer.invoke('fs:create-dir', path),
    deleteFile: (path) => ipcRenderer.invoke('fs:delete-file', path),
    rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    stat: (path) => ipcRenderer.invoke('fs:stat', path),
    exists: (path) => ipcRenderer.invoke('fs:exists', path),
    watch: (dirPath) => ipcRenderer.invoke('fs:watch', dirPath),
    unwatch: () => ipcRenderer.invoke('fs:unwatch'),
    onFileChanged: (callback) => {
      const handler = (_e, filePath) => callback(filePath)
      ipcRenderer.on('fs:file-changed', handler)
      return () => ipcRenderer.removeListener('fs:file-changed', handler)
    },
    onFileAdded: (callback) => {
      const handler = (_e, filePath) => callback(filePath)
      ipcRenderer.on('fs:file-added', handler)
      return () => ipcRenderer.removeListener('fs:file-added', handler)
    },
    onFileRemoved: (callback) => {
      const handler = (_e, filePath) => callback(filePath)
      ipcRenderer.on('fs:file-removed', handler)
      return () => ipcRenderer.removeListener('fs:file-removed', handler)
    }
  },
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
    openFile: (filters) => ipcRenderer.invoke('dialog:open-file', filters),
    saveFile: (filters) => ipcRenderer.invoke('dialog:save-file', filters),
    confirm: (message) => ipcRenderer.invoke('dialog:confirm', message)
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
    showItem: (path) => ipcRenderer.invoke('shell:show-item', path)
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPath: (name) => ipcRenderer.invoke('app:get-path', name)
  },
  ai: {
    request: (params) => ipcRenderer.invoke('ai:request', params),
    streamRequest: (params) => ipcRenderer.invoke('ai:stream-request', params),
    cancelStream: (termId) => ipcRenderer.send('ai:stream-cancel', { termId }),
    onStreamChunk: (callback) => {
      const handler = (_e, data) => callback(data)
      ipcRenderer.on('ai:stream-chunk', handler)
      return () => ipcRenderer.removeListener('ai:stream-chunk', handler)
    },
    onStreamEnd: (callback) => {
      const handler = (_e, data) => callback(data)
      ipcRenderer.on('ai:stream-end', handler)
      return () => ipcRenderer.removeListener('ai:stream-end', handler)
    },
    onStreamError: (callback) => {
      const handler = (_e, data) => callback(data)
      ipcRenderer.on('ai:stream-error', handler)
      return () => ipcRenderer.removeListener('ai:stream-error', handler)
    }
  },
  preview: {
    start: (projectPath, options) => ipcRenderer.invoke('preview:start', projectPath, options),
    stop: () => ipcRenderer.invoke('preview:stop'),
    getUrl: (filePath) => ipcRenderer.invoke('preview:url', filePath),
    getPort: () => ipcRenderer.invoke('preview:port'),
    setEffects: (css) => ipcRenderer.invoke('preview:set-effects', css),
    openExternalWindow: (url) => ipcRenderer.invoke('preview:open-external-window', url),
    refreshExternal: () => ipcRenderer.invoke('preview:refresh-external')
  },
  git: {
    init: (opts) => ipcRenderer.invoke('git:init', opts),
    status: (opts) => ipcRenderer.invoke('git:status', opts),
    log: (opts) => ipcRenderer.invoke('git:log', opts),
    stage: (opts) => ipcRenderer.invoke('git:stage', opts),
    unstage: (opts) => ipcRenderer.invoke('git:unstage', opts),
    commit: (opts) => ipcRenderer.invoke('git:commit', opts),
    branches: (opts) => ipcRenderer.invoke('git:branches', opts),
    checkout: (opts) => ipcRenderer.invoke('git:checkout', opts),
    createBranch: (opts) => ipcRenderer.invoke('git:create-branch', opts),
    diff: (opts) => ipcRenderer.invoke('git:diff', opts),
    discard: (opts) => ipcRenderer.invoke('git:discard', opts)
  },

  project: {
    exportZip: (opts) => ipcRenderer.invoke('project:export-zip', opts)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      invoke: ipcRenderer.invoke.bind(ipcRenderer),
      send: ipcRenderer.send.bind(ipcRenderer),
      on: ipcRenderer.on.bind(ipcRenderer),
      removeListener: ipcRenderer.removeListener.bind(ipcRenderer)
    }
  })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = { ipcRenderer }
  window.api = api
}

