/* LiveFront Settings module */
const STORAGE_KEY = 'livefront_settings'

function defaultSettings() {
  return {
    codeSources: {
      watchDir: '',
      watchFileTypes: ['html', 'css', 'js', 'jsx', 'vue', 'tsx', 'ts'],
      onNewFile: 'auto',
      clipboardOnCopy: 'prompt',
      autoFormats: ['HTML', 'JSX', 'Vue', 'CSS'],
      apiPort: 9527
    },
    dialogs: [],
    mcp: {
      autoStartServer: true,
      serverPort: 9528,
      autoReconnect: true,
      refreshIntervalMs: 5000,
      clients: []
    }
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw)
    return {
      ...defaultSettings(),
      ...parsed,
      codeSources: { ...defaultSettings().codeSources, ...parsed.codeSources },
      mcp: { ...defaultSettings().mcp, ...parsed.mcp, clients: Array.isArray(parsed.mcp?.clients) ? parsed.mcp.clients : [] }
    }
  } catch {
    return defaultSettings()
  }
}

function saveSettings(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  LiveFront.EventBus.emit('settings:changed', next)
}

LiveFront.Services.settings = {
  get(key) {
    const settings = loadSettings()
    return key ? settings[key] : settings
  },
  set(key, value) {
    const settings = loadSettings()
    settings[key] = value
    saveSettings(settings)
    return settings
  },
  getAll() {
    return loadSettings()
  },
  reset() {
    saveSettings(defaultSettings())
    return loadSettings()
  }
}

function openSettings(initialSection) {
  const overlay = document.createElement('div')
  overlay.className = 'settings-overlay'
  overlay.innerHTML = `
    <div class="settings-modal">
      <div class="settings-header">
        <div class="settings-title">LiveFront 设置</div>
        <button class="settings-close" id="settingsClose">✕</button>
      </div>
      <div class="settings-body">
        <div class="settings-nav" id="settingsNav"></div>
        <div class="settings-content" id="settingsContent"></div>
      </div>
      <div class="settings-footer">
        <span class="settings-hint">更改会立即保存到本地</span>
        <button class="btn btn-primary" id="settingsDone">完成</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  const sections = [
    { id: 'codeSources', label: '代码来源', render: renderCodeSources },
    { id: 'dialogs', label: 'AI 回传', render: renderDialogManager },
    { id: 'agents', label: 'Agent 集成', render: renderAgentIntegration },
    { id: 'general', label: '对话管理', render: renderDialogs },
    { id: 'editor', label: '编辑器', render: renderEditorSettings },
    { id: 'preview', label: '预览', render: renderPreviewSettings },
    { id: 'terminal', label: '终端', render: renderTerminalSettings },
    { id: 'about', label: '关于', render: renderAbout }
  ]

  let activeSection = initialSection || sections[0].id

  function setActive(sectionId) {
    activeSection = sectionId
    const nav = overlay.querySelector('#settingsNav')
    const content = overlay.querySelector('#settingsContent')
    nav.innerHTML = sections.map(section => `
      <div class="settings-nav-item ${section.id === activeSection ? 'active' : ''}" data-section="${section.id}">
        ${section.label}
      </div>
    `).join('')
    const current = sections.find(section => section.id === activeSection)
    content.innerHTML = ''
    if (current) current.render(content)
  }

  overlay.querySelector('#settingsNav').addEventListener('click', event => {
    const target = event.target.closest('.settings-nav-item')
    if (target) setActive(target.dataset.section)
  })
  overlay.querySelector('#settingsClose').addEventListener('click', () => overlay.remove())
  overlay.querySelector('#settingsDone').addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove() })

  setActive(activeSection)
}

function renderCodeSources(container) {
  const baseSettings = LiveFront.Services.settings.getAll()
  const codeSources = baseSettings.codeSources || defaultSettings().codeSources

  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">文件夹监听</div>
      <div class="settings-row">
        <div class="settings-label">监听目录</div>
        <div class="settings-control">
          <input class="settings-input" id="csWatchDir" placeholder="选择需要监听的目录" value="${codeSources.watchDir || ''}" />
          <button class="btn btn-ghost" id="csBrowseDir">浏览</button>
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">监听类型</div>
        <div class="settings-control" id="csWatchTypes"></div>
      </div>
      <div class="settings-row">
        <div class="settings-label">新文件行为</div>
        <div class="settings-control" id="csNewFileBehavior"></div>
      </div>
      <div class="settings-row">
        <div class="settings-label">复制到剪贴板</div>
        <div class="settings-control" id="csClipboard"></div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">格式支持</div>
      <div class="settings-row">
        <div class="settings-label">启用格式</div>
        <div class="settings-control" id="csFormats"></div>
      </div>
      <div class="settings-row">
        <div class="settings-label">API 端口</div>
        <div class="settings-control">
          <input class="settings-input" id="csApiPort" value="${codeSources.apiPort || 9527}" />
        </div>
      </div>
    </div>
  `

  const typesEl = container.querySelector('#csWatchTypes')
  const fileTypes = defaultSettings().codeSources.watchFileTypes
  for (const ft of fileTypes) {
    const tag = document.createElement('span')
    tag.className = `settings-tag ${codeSources.watchFileTypes.includes(ft) ? 'active' : ''}`
    tag.textContent = ft
    tag.addEventListener('click', () => {
      const nextSettings = LiveFront.Services.settings.getAll()
      const current = nextSettings.codeSources.watchFileTypes || []
      nextSettings.codeSources.watchFileTypes = current.includes(ft) ? current.filter(x => x !== ft) : [...current, ft]
      tag.classList.toggle('active')
      LiveFront.Services.settings.set('codeSources', nextSettings.codeSources)
    })
    typesEl.appendChild(tag)
  }

  const newFileEl = container.querySelector('#csNewFileBehavior')
  for (const opt of [{ value: 'auto', label: '自动打开' }, { value: 'prompt', label: '每次询问' }, { value: 'ignore', label: '忽略' }]) {
    const radio = document.createElement('span')
    radio.className = `settings-radio ${codeSources.onNewFile === opt.value ? 'active' : ''}`
    radio.textContent = opt.label
    radio.addEventListener('click', () => {
      const nextSettings = LiveFront.Services.settings.getAll()
      nextSettings.codeSources.onNewFile = opt.value
      newFileEl.querySelectorAll('.settings-radio').forEach(el => el.classList.remove('active'))
      radio.classList.add('active')
      LiveFront.Services.settings.set('codeSources', nextSettings.codeSources)
    })
    newFileEl.appendChild(radio)
  }

  const clipboardEl = container.querySelector('#csClipboard')
  for (const opt of [{ value: 'prompt', label: '询问' }, { value: 'auto', label: '自动' }, { value: 'off', label: '关闭' }]) {
    const radio = document.createElement('span')
    radio.className = `settings-radio ${codeSources.clipboardOnCopy === opt.value ? 'active' : ''}`
    radio.textContent = opt.label
    radio.addEventListener('click', () => {
      const nextSettings = LiveFront.Services.settings.getAll()
      nextSettings.codeSources.clipboardOnCopy = opt.value
      clipboardEl.querySelectorAll('.settings-radio').forEach(el => el.classList.remove('active'))
      radio.classList.add('active')
      LiveFront.Services.settings.set('codeSources', nextSettings.codeSources)
    })
    clipboardEl.appendChild(radio)
  }

  const formatsEl = container.querySelector('#csFormats')
  const allFormats = ['HTML', 'JSX', 'Vue', 'CSS']
  for (const fmt of allFormats) {
    const tag = document.createElement('span')
    tag.className = `settings-tag ${(codeSources.autoFormats || []).includes(fmt) ? 'active' : ''}`
    tag.textContent = fmt
    tag.addEventListener('click', () => {
      const nextSettings = LiveFront.Services.settings.getAll()
      const current = nextSettings.codeSources.autoFormats || []
      nextSettings.codeSources.autoFormats = current.includes(fmt) ? current.filter(x => x !== fmt) : [...current, fmt]
      tag.classList.toggle('active')
      LiveFront.Services.settings.set('codeSources', nextSettings.codeSources)
    })
    formatsEl.appendChild(tag)
  }

  container.querySelector('#csBrowseDir').addEventListener('click', async () => {
    const dir = await LiveFront.Services.dialog.openFolder()
    if (!dir) return
    container.querySelector('#csWatchDir').value = dir
    const nextSettings = LiveFront.Services.settings.getAll()
    nextSettings.codeSources.watchDir = dir
    LiveFront.Services.settings.set('codeSources', nextSettings.codeSources)
  })

  container.querySelector('#csApiPort').addEventListener('change', e => {
    const nextSettings = LiveFront.Services.settings.getAll()
    nextSettings.codeSources.apiPort = Number(e.target.value) || 9527
    LiveFront.Services.settings.set('codeSources', nextSettings.codeSources)
  })
}

function renderDialogManager(container) {
  const dialogSettings = LiveFront.Services.settings.getAll()
  const dialogList = dialogSettings.dialogs || []

  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">AI 回传管理</div>
      <div class="settings-hint">当工具从 AI 接收到代码片段时，可以记录到本地对话，便于后续整理与回放。</div>
      <div class="settings-toolbar">
        <button class="btn btn-ghost" id="dmAdd">新增对话</button>
      </div>
      <div class="settings-table" id="dmTable">
        <div class="settings-table-header">
          <span>名称</span>
          <span>来源</span>
          <span>最后更新</span>
          <span>条目数</span>
          <span>操作</span>
        </div>
      </div>
      <div id="dmEmpty" class="settings-empty ${dialogList.length ? '' : ''}">暂无对话记录</div>
    </div>
  `

  const tableEl = container.querySelector('#dmTable')
  const emptyEl = container.querySelector('#dmEmpty')

  for (const dialog of dialogList) {
    const row = document.createElement('div')
    row.className = 'settings-table-row'
    row.innerHTML = `
      <span class="settings-about">${dialog.name}</span>
      <span class="settings-secondary">${dialog.source || 'manual'}</span>
      <span class="settings-secondary">${new Date(dialog.updatedAt || Date.now()).toLocaleString()}</span>
      <span class="settings-secondary">${Array.isArray(dialog.messages) ? dialog.messages.length : 0}</span>
      <span class="settings-actions">
        <button class="btn btn-ghost" data-action="open">打开</button>
        <button class="btn btn-ghost" data-action="archive">归档</button>
      </span>
    `
    row.querySelector('[data-action="archive"]').addEventListener('click', () => {
      dialog.status = 'archived'
      LiveFront.Services.settings.set('dialogs', dialogList)
      row.querySelector('.settings-about').textContent = `${dialog.name}`
    })
    row.querySelector('[data-action="open"]').addEventListener('click', () => {
      LiveFront.EventBus.emit('dialog:open', { id: dialog.id })
    })
    tableEl.appendChild(row)
  }

  emptyEl.style.display = dialogList.length ? 'none' : 'block'
  container.querySelector('#dmAdd').addEventListener('click', () => {
    dialogList.push({
      id: Date.now().toString(36),
      name: `对话 ${dialogList.length + 1}`,
      source: 'manual',
      status: 'active',
      updatedAt: Date.now(),
      messages: []
    })
    LiveFront.Services.settings.set('dialogs', dialogList)
    openSettings('dialogs')
  })
}

function renderAgentIntegration(container) {
  const agentCfg = LiveFront.Services.settings.getAll()
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Agent 集成</div>
      <div class="settings-hint">控制 MCP Server、客户端连接以及 Claude / Cursor 配置导入。</div>
      <div class="settings-row">
        <div class="settings-label">自动启动 Server</div>
        <div class="settings-control" id="mcpAutoStart"></div>
      </div>
      <div class="settings-row">
        <div class="settings-label">Server 端口</div>
        <div class="settings-control">
          <input class="settings-input" id="mcpServerPort" value="${agentCfg.mcp?.serverPort || 9528}" />
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">刷新间隔(ms)</div>
        <div class="settings-control">
          <input class="settings-input" id="mcpRefreshMs" value="${agentCfg.mcp?.refreshIntervalMs || 5000}" />
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">导入配置</div>
        <div class="settings-control">
          <button class="btn btn-ghost" id="mcpImportClaude">Claude Desktop</button>
          <button class="btn btn-ghost" id="mcpImportCursor">Cursor</button>
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">已连接 Server</div>
        <div class="settings-control">
          <div id="mcpServerList" class="settings-secondary">加载中...</div>
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">配置预览</div>
        <div class="settings-control">
          <pre class="settings-input" id="mcpConfigPreview" style="min-height:120px;white-space:pre-wrap;"></pre>
        </div>
      </div>
    </div>
  `

  const autoStartEl = container.querySelector('#mcpAutoStart')
  const transportInput = document.createElement('input')
  const nameInput = document.createElement('input')
  const endpointInput = document.createElement('input')
  const argsInput = document.createElement('input')
  transportInput.placeholder = 'stdio / http'
  nameInput.placeholder = 'server 名称'
  endpointInput.placeholder = '命令或 URL'
  argsInput.placeholder = 'args(空格分隔)'
  transportInput.value = 'stdio'
  transportInput.className = nameInput.className = endpointInput.className = argsInput.className = 'settings-input'

  for (const opt of [{ value: true, label: '开启' }, { value: false, label: '关闭' }]) {
    const radio = document.createElement('span')
    radio.className = `settings-radio ${Boolean(agentCfg.mcp?.autoStartServer) === opt.value ? 'active' : ''}`
    radio.textContent = opt.label
    radio.addEventListener('click', () => {
      const next = LiveFront.Services.settings.getAll()
      next.mcp.autoStartServer = opt.value
      autoStartEl.querySelectorAll('.settings-radio').forEach(el => el.classList.remove('active'))
      radio.classList.add('active')
      LiveFront.Services.settings.set('mcp', next.mcp)
    })
    autoStartEl.appendChild(radio)
  }

  async function refreshMcpServers() {
    const listEl = container.querySelector('#mcpServerList')
    try {
      const servers = await LiveFront.Services.mcp.listConnectedServers()
      if (!servers || servers.length === 0) {
        listEl.textContent = '暂无已连接服务器'
        return
      }
      listEl.innerHTML = ''
      for (const s of servers) {
        const row = document.createElement('div')
        row.className = 'settings-table-row'
        row.innerHTML = `
          <span class="settings-about">${s.name}</span>
          <span class="settings-status ${s.status}">${s.status}</span>
          <span class="settings-secondary">${s.transport || ''}</span>
          <span></span>
          <span class="settings-actions">
            <button class="btn btn-ghost">断开</button>
          </span>
        `
        row.querySelector('button').addEventListener('click', async () => {
          try {
            await LiveFront.Services.mcp.disconnectServer(s.name)
            await refreshMcpServers()
          } catch (err) {
            alert('断开失败: ' + err.message)
          }
        })
        listEl.appendChild(row)
      }
    } catch (err) {
      listEl.textContent = '读取已连接服务器失败: ' + err.message
    }
  }

  function refreshConfigPreview() {
    const previewEl = container.querySelector('#mcpConfigPreview')
    if (!previewEl) return
    const next = LiveFront.Services.settings.getAll()
    previewEl.textContent = JSON.stringify(next.mcp || {}, null, 2)
  }

  container.querySelector('#mcpServerPort').addEventListener('change', e => {
    const next = LiveFront.Services.settings.getAll()
    next.mcp.serverPort = Number(e.target.value) || 9528
    LiveFront.Services.settings.set('mcp', next.mcp)
    refreshConfigPreview()
  })
  container.querySelector('#mcpRefreshMs').addEventListener('change', e => {
    const next = LiveFront.Services.settings.getAll()
    next.mcp.refreshIntervalMs = Number(e.target.value) || 5000
    LiveFront.Services.settings.set('mcp', next.mcp)
    refreshConfigPreview()
  })

  let agentTimer = null
  function startAgentRefresh(intervalMs) {
    if (agentTimer) clearInterval(agentTimer)
    agentTimer = setInterval(refreshConfigPreview, intervalMs || 5000)
  }

  async function openImportPreview(sourceName, filePath) {
    const preview = document.createElement('div')
    preview.className = 'settings-section'
    preview.innerHTML = `<div class="settings-section-title">选择导入 ${sourceName} Server</div>`
    container.appendChild(preview)

    try {
      const rawContent = await LiveFront.Services.fileSystem.readFile(filePath); const parsed = JSON.parse(rawContent)
      const entries = Object.entries(parsed.mcpServers || parsed.mcp?.servers || {})
      if (!entries.length) { alert('未检测到可导入 Server'); return }
      const selected = []
      for (const [name, value] of entries) {
        const row = document.createElement('div')
        row.className = 'settings-row'
        row.innerHTML = `
          <div class="settings-label">${name}</div>
          <div class="settings-control">
            <label><input type="checkbox" data-name="${name}" /> 启用</label>
            <span class="settings-secondary">${value.url || value.command || ''}</span>
          </div>
        `
        const checkbox = row.querySelector('input')
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selected.push(name)
          else {
            const i = selected.indexOf(name)
            if (i >= 0) selected.splice(i, 1)
          }
        })
        preview.appendChild(row)
      }

      const applyBtn = document.createElement('button')
      applyBtn.className = 'btn btn-primary'
      applyBtn.textContent = '导入选中'
      applyBtn.addEventListener('click', async () => {
        if (!selected.length) { alert('请至少选择一个 Server'); return }
        let imported = 0
        for (const [name, value] of entries) {
          if (!selected.includes(name)) continue
          try {
            await LiveFront.Services.mcp.connectServer({
              name,
              transport: value.url ? 'http' : 'stdio',
              command: value.command || null,
              args: Array.isArray(value.args) ? value.args : [],
              url: value.url || null,
              env: value.env || null,
              source: sourceName,
              sourcePath: filePath
            })
            imported++
          } catch {}
        }
        alert(`已导入 ${imported} 个 Server`);
        preview.innerHTML = ''
        await refreshMcpServers()
      })
      preview.appendChild(applyBtn)
    } catch (error) {
      alert('解析配置失败: ' + error.message);
    }
  }

  container.querySelector('#mcpImportClaude').addEventListener('click', async () => {
    const filePath = await LiveFront.Services.dialog.openFile([{ name: 'JSON', extensions: ['json'] }])
    if (!filePath) return
    await openImportPreview('Claude Desktop', filePath)
  })
  container.querySelector('#mcpImportCursor').addEventListener('click', async () => {
    const filePath = await LiveFront.Services.dialog.openFile([{ name: 'JSON', extensions: ['json'] }])
    if (!filePath) return
    await openImportPreview('Cursor', filePath)
  })

  container.querySelector('#mcpAddServerBtn')?.addEventListener('click', async () => {
    const transport = transportInput.value
    const name = nameInput.value.trim()
    const endpoint = endpointInput.value.trim()
    const argsRaw = argsInput.value.trim()
    if (!name) { alert('请输入名称'); return }
    if (!endpoint) { alert('请输入命令或 URL'); return }
    const config = {
      name,
      transport,
      command: transport === 'stdio' ? endpoint : null,
      args: transport === 'stdio' ? argsRaw.split(/\s+/).filter(Boolean) : [],
      url: transport === 'http' ? endpoint : null
    }
    try {
      await LiveFront.Services.mcp.connectServer(config)
      nameInput.value = ''
      endpointInput.value = ''
      argsInput.value = ''
      await refreshMcpServers()
    } catch (error) {
      alert('连接失败: ' + error.message);
    }
  })

  refreshMcpServers()
  refreshConfigPreview()
  startAgentRefresh(agentCfg.mcp?.refreshIntervalMs || 5000)
}

function renderDialogs(container) {
  const dialogsCfg = LiveFront.Services.settings.getAll()
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">对话管理</div>
      <div class="settings-hint">这里显示基础的对话管理能力，后续会接入更完整的对话列表。</div>
      <div class="settings-row">
        <div class="settings-label">已配置对话数</div>
        <div class="settings-control">
          <span>${(dialogsCfg.dialogs || []).length}</span>
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">默认导出格式</div>
        <div class="settings-control">
          <select class="settings-input" id="dmExportFormat">
            ${['markdown', 'json', 'text'].map(item => `<option value="${item}">${item}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
  `
}

function renderEditorSettings(container) {
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">编辑器设置</div>
      <div class="settings-hint">编辑器占位，后续可扩展字号、主题、自动保存等选项。</div>
    </div>
  `
}

function renderPreviewSettings(container) {
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">预览设置</div>
      <div class="settings-hint">预览占位，后续可扩展默认视口、刷新策略等。</div>
    </div>
  `
}

function renderTerminalSettings(container) {
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">终端设置</div>
      <div class="settings-hint">终端占位，后续可扩展默认 Shell 和字号。</div>
    </div>
  `
}

function renderAbout(container) {
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">关于 LiveFront</div>
      <div class="settings-hint">LiveFront 是预览优先的前端开发工具。</div>
    </div>
  `
}

LiveFront.Commands.register('settings.open', openSettings)

export { openSettings }

