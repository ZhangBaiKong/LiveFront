/* LiveFront Settings module — manifest 注册 */
(function () {
LiveFront.modules.register({
  id: 'settings',
  name: '设置',
  version: '1.0.0',
  description: 'LiveFront 全局设置 — 代码来源、MCP、编辑器、预览等配置',

  dependencies: [],
  optionalDependencies: [],

  ui: {},
  commands: [
    { id: 'settings.open', label: '打开设置' }
  ],
  shortcuts: [
    { key: 'Ctrl+,', command: 'settings.open' }
  ],
  menus: [
    {
      menuPath: '帮助',
      items: [
        { label: '设置…', command: 'settings.open', shortcut: 'Ctrl+,' }
      ]
    }
  ],
  contextMenus: [],

  events: {
    emits: [
      { name: 'settings:changed', payload: '{ settings }' }
    ],
    listens: []
  },

  state: {},

  async init(ctx) {
    this._ctx = ctx
    console.log('[Settings] Module initialized')
  },

  destroy() {}
})
})()

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
        <div class="settings-control" id="csNewFileAction"></div>
      </div>
      <div class="settings-row">
        <div class="settings-label">复制行为</div>
        <div class="settings-control" id="csCopyAction"></div>
      </div>
      <div class="settings-row">
        <div class="settings-label">API 端口</div>
        <div class="settings-control">
          <input class="settings-input" id="csApiPort" type="number" value="${codeSources.apiPort || 9527}" />
        </div>
      </div>
    </div>
  `

  const typesContainer = container.querySelector('#csWatchTypes')
  const allTypes = ['html', 'css', 'js', 'jsx', 'vue', 'tsx', 'ts']
  const activeTypes = new Set(codeSources.watchFileTypes || [])
  allTypes.forEach(type => {
    const tag = document.createElement('span')
    tag.className = 'settings-tag' + (activeTypes.has(type) ? ' active' : '')
    tag.textContent = type
    tag.addEventListener('click', () => {
      tag.classList.toggle('active')
      const next = new Set()
      typesContainer.querySelectorAll('.settings-tag.active').forEach(t => next.add(t.textContent))
      const settings = loadSettings()
      settings.codeSources.watchFileTypes = Array.from(next)
      saveSettings(settings)
    })
    typesContainer.appendChild(tag)
  })

  const newFileOptions = [
    { value: 'auto', label: '自动打开' },
    { value: 'prompt', label: '询问' },
    { value: 'ignore', label: '忽略' }
  ]
  const newFileContainer = container.querySelector('#csNewFileAction')
  newFileOptions.forEach(opt => {
    const radio = document.createElement('span')
    radio.className = 'settings-radio' + (codeSources.onNewFile === opt.value ? ' active' : '')
    radio.textContent = opt.label
    radio.addEventListener('click', () => {
      newFileContainer.querySelectorAll('.settings-radio').forEach(r => r.classList.remove('active'))
      radio.classList.add('active')
      const settings = loadSettings()
      settings.codeSources.onNewFile = opt.value
      saveSettings(settings)
    })
    newFileContainer.appendChild(radio)
  })

  const copyOptions = [
    { value: 'prompt', label: '询问' },
    { value: 'auto', label: '自动复制' },
    { value: 'ignore', label: '忽略' }
  ]
  const copyContainer = container.querySelector('#csCopyAction')
  copyOptions.forEach(opt => {
    const radio = document.createElement('span')
    radio.className = 'settings-radio' + (codeSources.clipboardOnCopy === opt.value ? ' active' : '')
    radio.textContent = opt.label
    radio.addEventListener('click', () => {
      copyContainer.querySelectorAll('.settings-radio').forEach(r => r.classList.remove('active'))
      radio.classList.add('active')
      const settings = loadSettings()
      settings.codeSources.clipboardOnCopy = opt.value
      saveSettings(settings)
    })
    copyContainer.appendChild(radio)
  })

  const apiPortInput = container.querySelector('#csApiPort')
  apiPortInput.addEventListener('change', () => {
    const settings = loadSettings()
    settings.codeSources.apiPort = parseInt(apiPortInput.value) || 9527
    saveSettings(settings)
  })
}

function renderDialogManager(container) {
  const settings = loadSettings()
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">AI 回传设置</div>
      <div class="settings-hint">管理 AI 对话回传配置。</div>
      <div class="settings-row">
        <div class="settings-label">已配置对话数</div>
        <div class="settings-control">
          <span>${(settings.dialogs || []).length}</span>
        </div>
      </div>
    </div>
  `
}

function renderAgentIntegration(container) {
  const agentCfg = loadSettings()
  const mcpCfg = agentCfg.mcp || defaultSettings().mcp

  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">MCP Server 管理</div>
      <div class="settings-hint">配置和管理 MCP (Model Context Protocol) 服务器连接。</div>

      <div class="settings-row">
        <div class="settings-label">自动启动</div>
        <div class="settings-control">
          <span class="settings-radio ${mcpCfg.autoStartServer ? 'active' : ''}" id="mcpAutoStart">${mcpCfg.autoStartServer ? '是' : '否'}</span>
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">服务端口</div>
        <div class="settings-control">
          <input class="settings-input" id="mcpPort" type="number" value="${mcpCfg.serverPort || 9528}" />
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">自动重连</div>
        <div class="settings-control">
          <span class="settings-radio ${mcpCfg.autoReconnect ? 'active' : ''}" id="mcpAutoReconnect">${mcpCfg.autoReconnect ? '是' : '否'}</span>
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">刷新间隔(ms)</div>
        <div class="settings-control">
          <input class="settings-input" id="mcpRefreshMs" type="number" value="${mcpCfg.refreshIntervalMs || 5000}" />
        </div>
      </div>

      <div class="settings-section-title" style="margin-top:20px;">已连接的 Servers</div>
      <div id="mcpServerList" class="settings-table"></div>

      <div class="settings-section-title" style="margin-top:20px;">添加新 Server</div>
      <div class="settings-row">
        <div class="settings-label">传输方式</div>
        <div class="settings-control" id="mcpTransport"></div>
      </div>
      <div class="settings-row">
        <div class="settings-label">名称</div>
        <div class="settings-control">
          <input class="settings-input" id="mcpName" placeholder="Server 名称" />
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">命令/URL</div>
        <div class="settings-control">
          <input class="settings-input" id="mcpEndpoint" placeholder="stdio 命令或 HTTP URL" />
        </div>
      </div>
      <div class="settings-row">
        <div class="settings-label">参数</div>
        <div class="settings-control">
          <input class="settings-input" id="mcpArgs" placeholder="空格分隔的参数" />
        </div>
      </div>
      <div class="settings-toolbar">
        <button class="btn btn-primary" id="mcpAddServerBtn">添加</button>
      </div>

      <div class="settings-section-title" style="margin-top:20px;">导入配置</div>
      <div class="settings-row">
        <div class="settings-label">导入来源</div>
        <div class="settings-control" style="gap:8px;">
          <button class="btn btn-ghost" id="mcpImportClaude">从 Claude Desktop 导入</button>
          <button class="btn btn-ghost" id="mcpImportCursor">从 Cursor 导入</button>
        </div>
      </div>
      <div id="mcpImportPreview"></div>

      <div class="settings-section-title" style="margin-top:20px;">配置预览</div>
      <div class="settings-row">
        <div class="settings-label">当前配置</div>
        <div class="settings-control">
          <pre id="mcpConfigPreview" style="font-size:12px;white-space:pre-wrap;max-height:200px;overflow:auto;padding:8px;background:var(--bg-secondary);border-radius:6px;width:100%;"></pre>
        </div>
      </div>
    </div>
  `

  const transportInput = container.querySelector('#mcpTransport')
  const transportOptions = [
    { value: 'stdio', label: 'stdio' },
    { value: 'http', label: 'HTTP/SSE' }
  ]
  transportOptions.forEach(opt => {
    const radio = document.createElement('span')
    radio.className = 'settings-radio' + (opt.value === 'stdio' ? ' active' : '')
    radio.textContent = opt.label
    radio.dataset.value = opt.value
    radio.addEventListener('click', () => {
      transportInput.querySelectorAll('.settings-radio').forEach(r => r.classList.remove('active'))
      radio.classList.add('active')
    })
    transportInput.appendChild(radio)
  })

  const nameInput = container.querySelector('#mcpName')
  const endpointInput = container.querySelector('#mcpEndpoint')
  const argsInput = container.querySelector('#mcpArgs')

  let refreshTimer = null
  function startAgentRefresh(intervalMs) {
    if (refreshTimer) clearInterval(refreshTimer)
    refreshTimer = setInterval(() => refreshMcpServers(), intervalMs)
  }

  async function refreshMcpServers() {
    const listEl = container.querySelector('#mcpServerList')
    if (!listEl) return
    const servers = LiveFront.Services.mcp?.getServers?.() || []
    if (!servers.length) {
      listEl.innerHTML = '<div class="settings-empty">暂无已连接的 MCP Server</div>'
      return
    }
    listEl.innerHTML = '<div class="settings-table-header"><span>名称</span><span>传输</span><span>端点</span><span>状态</span><span>操作</span></div>' +
      servers.map(s => `
        <div class="settings-table-row">
          <span>${s.name || '-'}</span>
          <span>${s.transport || '-'}</span>
          <span class="settings-secondary">${s.url || s.command || '-'}</span>
          <span><span class="settings-status ${s.status || 'active'}">${s.status || 'connected'}</span></span>
          <span class="settings-actions">
            <button class="btn btn-ghost btn-sm" data-action="disconnect" data-name="${s.name}">断开</button>
          </span>
        </div>
      `).join('')
    listEl.querySelectorAll('[data-action="disconnect"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.name
        try { await LiveFront.Services.mcp.disconnectServer(name) } catch {}
        await refreshMcpServers()
      })
    })
  }

  function refreshConfigPreview() {
    const previewEl = container.querySelector('#mcpConfigPreview')
    if (!previewEl) return
    const servers = LiveFront.Services.mcp?.getServers?.() || []
    previewEl.textContent = JSON.stringify({ mcpServers: servers }, null, 2)
  }

  container.querySelector('#mcpAutoStart')?.addEventListener('click', () => {
    const el = container.querySelector('#mcpAutoStart')
    const next = !loadSettings().mcp?.autoStartServer
    const settings = loadSettings()
    settings.mcp.autoStartServer = next
    saveSettings(settings)
    el.classList.toggle('active', next)
    el.textContent = next ? '是' : '否'
  })

  container.querySelector('#mcpAutoReconnect')?.addEventListener('click', () => {
    const el = container.querySelector('#mcpAutoReconnect')
    const next = !loadSettings().mcp?.autoReconnect
    const settings = loadSettings()
    settings.mcp.autoReconnect = next
    saveSettings(settings)
    el.classList.toggle('active', next)
    el.textContent = next ? '是' : '否'
  })

  container.querySelector('#mcpPort')?.addEventListener('change', () => {
    const settings = loadSettings()
    settings.mcp.serverPort = parseInt(container.querySelector('#mcpPort').value) || 9528
    saveSettings(settings)
  })

  container.querySelector('#mcpRefreshMs')?.addEventListener('change', () => {
    const settings = loadSettings()
    settings.mcp.refreshIntervalMs = parseInt(container.querySelector('#mcpRefreshMs').value) || 5000
    saveSettings(settings)
    startAgentRefresh(settings.mcp.refreshIntervalMs)
  })

  async function openImportPreview(sourceName, filePath) {
    const preview = container.querySelector('#mcpImportPreview')
    if (!preview) return
    try {
      const raw = await LiveFront.Services.fs.readFile(filePath)
      const parsed = JSON.parse(raw)
      const servers = parsed.mcpServers || parsed.mcp_servers || {}
      const entries = Object.entries(servers)
      if (!entries.length) {
        preview.innerHTML = '<div class="settings-empty">未找到 Server 配置</div>'
        return
      }
      const selected = []
      preview.innerHTML = '<div class="settings-section"><div class="settings-section-title">导入预览 — ' + sourceName + '</div></div>'
      for (const [name, value] of entries) {
        const row = document.createElement('div')
        row.className = 'settings-table-row'
        row.innerHTML = '<span><input type="checkbox" checked data-name="' + name + '" /> ' + name + '</span><span>' + (value.transport || (value.url ? 'http' : 'stdio')) + '</span><span class="settings-secondary">' + (value.url || value.command || '-') + '</span>'
        selected.push(name)
        row.querySelector('input').addEventListener('change', (e) => {
          if (e.target.checked) selected.push(name)
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
        alert(`已导入 ${imported} 个 Server`)
        preview.innerHTML = ''
        await refreshMcpServers()
      })
      preview.appendChild(applyBtn)
    } catch (error) {
      alert('解析配置失败: ' + error.message)
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
    const transport = transportInput.querySelector('.settings-radio.active')?.dataset?.value || 'stdio'
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
      alert('连接失败: ' + error.message)
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
