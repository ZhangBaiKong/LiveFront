/* LiveFront Settings module */
import './settings.css'

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
  const settings = LiveFront.Services.settings.getAll()
  const codeSources = settings.codeSources || defaultSettings().codeSources

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
        <div class="settings-label">监听文件类型</div>
        <div class="settings-control settings-tags" id="csFileTypes"></div>
      </div>
      <div class="settings-row">
        <div class="settings-label">检测到新文件时</div>
        <div class="settings-control settings-radio-group" id="csNewFileBehavior"></div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">剪贴板监听</div>
      <div class="settings-row">
        <div class="settings-label">复制代码时</div>
        <div class="settings-control settings-radio-group" id="csClipboardBehavior"></div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">自动格式识别</div>
      <div class="settings-row">
        <div class="settings-label">识别格式</div>
        <div class="settings-control settings-tags" id="csAutoFormats"></div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">本地 API</div>
      <div class="settings-row">
        <div class="settings-label">端口</div>
        <div class="settings-control">
          <input class="settings-input" id="csApiPort" type="number" min="1024" max="65535" value="${codeSources.apiPort || 9527}" />
        </div>
      </div>
    </div>
  `

  const fileTypeTags = container.querySelector('#csFileTypes')
  const allFileTypes = ['html', 'css', 'js', 'jsx', 'vue', 'tsx', 'ts', 'json', 'md', 'svg']
  fileTypeTags.innerHTML = allFileTypes.map(type => `
    <span class="settings-tag-toggle ${(codeSources.watchFileTypes || []).includes(type) ? 'active' : ''}" data-type="${type}">${type}</span>
  `).join('')
  fileTypeTags.addEventListener('click', e => {
    const tag = e.target.closest('.settings-tag-toggle')
    if (!tag) return
    tag.classList.toggle('active')
    const next = loadSettings()
    next.codeSources.watchFileTypes = [...fileTypeTags.querySelectorAll('.settings-tag-toggle.active')].map(el => el.dataset.type)
    saveSettings(next)
  })

  const newFileGroup = container.querySelector('#csNewFileBehavior')
  const newFileOptions = [
    { value: 'auto', label: '自动导入' },
    { value: 'prompt', label: '提示导入' },
    { value: 'ignore', label: '忽略' }
  ]
  newFileGroup.innerHTML = newFileOptions.map(option => `
    <label class="settings-radio">
      <input type="radio" name="csNewFile" value="${option.value}" ${codeSources.onNewFile === option.value ? 'checked' : ''} />
      <span>${option.label}</span>
    </label>
  `).join('')
  newFileGroup.addEventListener('change', e => {
    if (e.target.name !== 'csNewFile') return
    const next = loadSettings()
    next.codeSources.onNewFile = e.target.value
    saveSettings(next)
  })

  const clipboardGroup = container.querySelector('#csClipboardBehavior')
  const clipboardOptions = [
    { value: 'auto', label: '自动导入' },
    { value: 'prompt', label: '提示导入' },
    { value: 'ignore', label: '忽略' }
  ]
  clipboardGroup.innerHTML = clipboardOptions.map(option => `
    <label class="settings-radio">
      <input type="radio" name="csClipboard" value="${option.value}" ${codeSources.clipboardOnCopy === option.value ? 'checked' : ''} />
      <span>${option.label}</span>
    </label>
  `).join('')
  clipboardGroup.addEventListener('change', e => {
    if (e.target.name !== 'csClipboard') return
    const next = loadSettings()
    next.codeSources.clipboardOnCopy = e.target.value
    saveSettings(next)
  })

  const autoFormats = container.querySelector('#csAutoFormats')
  const allFormats = ['HTML', 'JSX', 'Vue', 'CSS', 'Svelte', 'Markdown']
  autoFormats.innerHTML = allFormats.map(format => `
    <span class="settings-tag-toggle ${(codeSources.autoFormats || []).includes(format) ? 'active' : ''}" data-format="${format}">${format}</span>
  `).join('')
  autoFormats.addEventListener('click', e => {
    const tag = e.target.closest('.settings-tag-toggle')
    if (!tag) return
    tag.classList.toggle('active')
    const next = loadSettings()
    next.codeSources.autoFormats = [...autoFormats.querySelectorAll('.settings-tag-toggle.active')].map(el => el.dataset.format)
    saveSettings(next)
  })

  const portInput = container.querySelector('#csApiPort')
  portInput.addEventListener('change', () => {
    const next = loadSettings()
    next.codeSources.apiPort = Math.max(1024, Math.min(65535, Number(portInput.value) || 9527))
    saveSettings(next)
  })

  const dirInput = container.querySelector('#csWatchDir')
  dirInput.addEventListener('change', () => {
    const next = loadSettings()
    next.codeSources.watchDir = dirInput.value.trim()
    saveSettings(next)
  })

  container.querySelector('#csBrowseDir').addEventListener('click', async () => {
    const folder = await LiveFront.Services.dialog.openFolder()
    if (!folder) return
    dirInput.value = folder
    const next = loadSettings()
    next.codeSources.watchDir = folder
    saveSettings(next)
  })
}

function renderDialogManager(container) {
  const settings = LiveFront.Services.settings.getAll()
  const dialogs = Array.isArray(settings.dialogs) ? [...settings.dialogs] : []

  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">AI 回传配置</div>
      <div class="settings-hint">配置 AI 对话后，可在修改线中将修改摘要发送回对应的 AI 工具。</div>
      <div class="settings-table" id="dialogTable"></div>
      <div class="settings-row" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="dialogAddBtn">添加 AI 对话</button>
      </div>
    </div>
  `

  const table = container.querySelector('#dialogTable')

  function renderTable() {
    if (!dialogs.length) {
      table.innerHTML = '<div class="settings-empty">暂未配置 AI 对话</div>'
      return
    }

    table.innerHTML = `
      <div class="settings-table-header">
        <div>名称</div>
        <div>类型</div>
        <div>标识</div>
        <div>状态</div>
        <div>操作</div>
      </div>
      ${dialogs.map(dialog => `
        <div class="settings-table-row" data-id="${dialog.id}">
          <div>${dialog.name || '未命名对话'}</div>
          <div><span class="settings-tag">${dialog.type || 'other'}</span></div>
          <div class="settings-secondary">${dialog.identifier || '-'}</div>
          <div><span class="settings-status ${dialog.status || 'active'}">${dialog.status || 'active'}</span></div>
          <div class="settings-actions">
            <button class="btn btn-ghost" data-action="edit" data-id="${dialog.id}">编辑</button>
            <button class="btn btn-ghost danger" data-action="remove" data-id="${dialog.id}">删除</button>
          </div>
        </div>
      `).join('')}
    `

    table.querySelectorAll('[data-action="remove"]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id
        const next = LiveFront.Services.settings.getAll()
        next.dialogs = (next.dialogs || []).filter(item => item.id !== id)
        LiveFront.Services.settings.set('dialogs', next.dialogs)
        dialogs.length = 0
        dialogs.push(...next.dialogs)
        renderTable()
      })
    })

    table.querySelectorAll('[data-action="edit"]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id
        const target = dialogs.find(item => item.id === id)
        if (!target) return
        openDialogForm(target, updated => {
          const next = LiveFront.Services.settings.getAll()
          next.dialogs = (next.dialogs || []).map(item => item.id === updated.id ? { ...item, ...updated } : item)
          LiveFront.Services.settings.set('dialogs', next.dialogs)
          dialogs.length = 0
          dialogs.push(...next.dialogs)
          renderTable()
        })
      })
    })
  }

  container.querySelector('#dialogAddBtn').addEventListener('click', () => {
    openDialogForm(null, created => {
      const next = LiveFront.Services.settings.getAll()
      next.dialogs = [...(next.dialogs || []), created]
      LiveFront.Services.settings.set('dialogs', next.dialogs)
      dialogs.length = 0
      dialogs.push(...next.dialogs)
      renderTable()
    })
  })

  renderTable()
}

function openDialogForm(dialog, onSubmit) {
  const overlay = document.createElement('div')
  overlay.className = 'settings-overlay'
  const current = dialog || {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: '',
    type: 'other',
    identifier: '',
    projectPath: '',
    status: 'active'
  }

  overlay.innerHTML = `
    <div class="settings-modal settings-form-modal">
      <div class="settings-header">
        <div class="settings-title">${dialog ? '编辑 AI 对话' : '添加 AI 对话'}</div>
        <button class="settings-close" id="dialogFormClose">✕</button>
      </div>
      <div class="settings-body settings-form-body">
        <div class="settings-form-grid">
          <label class="settings-form-label">名称</label>
          <input class="settings-input" id="dialogFormName" value="${current.name || ''}" placeholder="例如：首页重构对话" />

          <label class="settings-form-label">类型</label>
          <select class="settings-input" id="dialogFormType">
            ${['codex', 'chatgpt', 'claude-web', 'doubao-web', 'mcp', 'other'].map(type => `<option value="${type}" ${current.type === type ? 'selected' : ''}>${type}</option>`).join('')}
          </select>

          <label class="settings-form-label">标识</label>
          <input class="settings-input" id="dialogFormIdentifier" value="${current.identifier || ''}" placeholder="对话ID / URL / CLI命令" />

          <label class="settings-form-label">关联项目路径</label>
          <input class="settings-input" id="dialogFormProjectPath" value="${current.projectPath || ''}" placeholder="可选" />

          <label class="settings-form-label">状态</label>
          <select class="settings-input" id="dialogFormStatus">
            ${['active', 'synced', 'archived'].map(status => `<option value="${status}" ${current.status === status ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="settings-footer">
        <span class="settings-hint">建议填写准确的标识，便于后续自动回传</span>
        <div class="settings-footer-actions">
          <button class="btn btn-ghost" id="dialogFormCancel">取消</button>
          <button class="btn btn-primary" id="dialogFormSubmit">保存</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  overlay.querySelector('#dialogFormClose').addEventListener('click', () => overlay.remove())
  overlay.querySelector('#dialogFormCancel').addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove() })

  overlay.querySelector('#dialogFormSubmit').addEventListener('click', () => {
    const payload = {
      id: current.id,
      name: overlay.querySelector('#dialogFormName').value.trim(),
      type: overlay.querySelector('#dialogFormType').value,
      identifier: overlay.querySelector('#dialogFormIdentifier').value.trim(),
      projectPath: overlay.querySelector('#dialogFormProjectPath').value.trim(),
      status: overlay.querySelector('#dialogFormStatus').value
    }
    onSubmit(payload)
    overlay.remove()
  })
}

function renderAgentIntegration(container) {
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">已安装的 Agent</div>
      <div class="settings-row" style="gap:8px; align-items:center;">
        <button class="btn btn-primary" id="agentScanBtn">🔍 一键扫描</button>
        <span class="settings-secondary" id="agentScanStatus"></span>
      </div>
      <div class="settings-table" id="agentScanTable"></div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">MCP Server 管理</div>
      <div class="settings-table" id="mcpServerTable"></div>
      <div class="settings-row" style="flex-wrap:wrap; gap:8px; margin-top:8px;">
        <button class="btn btn-primary" id="mcpAddServerBtn">连接新 Server</button>
        <button class="btn btn-ghost" id="mcpImportClaude">从 Claude 导入</button>
        <button class="btn btn-ghost" id="mcpImportCursor">从 Cursor 导入</button>
      </div>
      <div class="settings-form-grid" style="margin-top:10px;">
        <label class="settings-form-label">类型</label>
        <select class="settings-input" id="mcpTransport"><option value="stdio">stdio</option><option value="http">http</option></select>
        <label class="settings-form-label">名称</label>
        <input class="settings-input" id="mcpName" placeholder="例如：filesystem" />
        <label class="settings-form-label">命令 / URL</label>
        <input class="settings-input" id="mcpEndpoint" placeholder="stdio 填写命令，http 填写 URL" />
        <label class="settings-form-label">参数</label>
        <input class="settings-input" id="mcpArgs" placeholder="空格分隔的参数，仅 stdio" />
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">LiveFront MCP 配置</div>
      <div class="settings-hint">LiveFront 作为 MCP Server 运行后，其他 AI Agent 可以通过以下配置连接。</div>
      <div class="settings-row" style="gap:8px; flex-wrap:wrap;">
        <button class="btn btn-ghost" id="mcpCopyClaude">📋 Claude Desktop</button>
        <button class="btn btn-ghost" id="mcpCopyCursor">📋 Cursor</button>
        <button class="btn btn-ghost" id="mcpCopyGeneric">📋 通用 JSON</button>
        <button class="btn btn-ghost" id="mcpExportClaude">⬇️ 导出 Claude</button>
        <button class="btn btn-ghost" id="mcpExportCursor">⬇️ 导出 Cursor</button>
        <button class="btn btn-ghost" id="mcpExportGeneric">⬇️ 导出通用</button>
      </div>
      <div class="settings-hint">导入前会先解析配置，确认后批量添加选中的 Server。</div>
      <div id="mcpImportPreview"></div>
      <pre class="settings-code" id="mcpConfigPreview">加载中...</pre>
      <div class="settings-row" style="gap:8px;">
        <button class="btn btn-primary" id="mcpStartBtn">启动 MCP Server</button>
        <button class="btn btn-ghost" id="mcpStopBtn">停止 MCP Server</button>
      </div>
    </div>
  `

  const scanBtn = container.querySelector('#agentScanBtn')
  const scanStatus = container.querySelector('#agentScanStatus')
  const scanTable = container.querySelector('#agentScanTable')
  const serverTable = container.querySelector('#mcpServerTable')
  const configPreview = container.querySelector('#mcpConfigPreview')
  const transportInput = container.querySelector('#mcpTransport')
  const nameInput = container.querySelector('#mcpName')
  const endpointInput = container.querySelector('#mcpEndpoint')
  const argsInput = container.querySelector('#mcpArgs')

  let agentRefreshTimer = null;

  function stopAgentRefresh() {
    if (agentRefreshTimer) {
      clearInterval(agentRefreshTimer);
      agentRefreshTimer = null;
    }
  }

  async function refreshScanResults() {
    try {
      scanStatus.textContent = '扫描中...'
      const result = await LiveFront.Services.agent.scan()
      scanStatus.textContent = result?.scanTime ? `上次扫描 ${new Date(result.scanTime).toLocaleTimeString()}` : '扫描完成'
      renderScanTable(Array.isArray(result?.detectedAgents) ? result.detectedAgents : [])
    } catch (error) {
      scanStatus.textContent = `扫描失败: ${error.message}`
      scanTable.innerHTML = '<div class="settings-empty">扫描失败</div>'
    }
  }

  function startAgentRefresh(intervalMs) {
    stopAgentRefresh();
    if (!intervalMs || intervalMs < 1000) return;
    agentRefreshTimer = setInterval(() => {
      refreshScanResults();
      refreshMcpServers();
    }, intervalMs);
  }

  function renderScanTable(agents) {
    if (!agents.length) {
      scanTable.innerHTML = '<div class="settings-empty">未检测到 Agent</div>'
      return
    }
    scanTable.innerHTML = `
      <div class="settings-table-header agent-grid">
        <div>状态</div><div>名称</div><div>类型</div><div>版本</div><div>路径 / 配置</div><div>操作</div>
      </div>
      ${agents.map(agent => `
        <div class="settings-table-row agent-grid" data-status="${agent.status}">
          <div>${statusIcon(agent.status)}</div>
          <div>${agent.name}</div>
          <div><span class="settings-tag">${agent.type}</span></div>
          <div class="settings-secondary">${agent.version || '-'}</div>
          <div class="settings-secondary">${agent.configPath || agent.path || '-'}</div>
          <div>
            <button class="btn btn-ghost" data-action="configure-agent" data-name="${agent.name}">配置连接</button>
          </div>
        </div>
      `).join('')}
    `
    scanTable.querySelectorAll('[data-action="configure-agent"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const res = await LiveFront.Services.agent.getConfig(btn.dataset.name)
        if (res?.success && res.mcpServers?.length) {
          for (const server of res.mcpServers) {
            try {
              await LiveFront.Services.mcp.connectServer({ name: server.name, transport: server.url ? 'http' : 'stdio', command: server.command, args: server.args, url: server.url, source: btn.dataset.name, sourcePath: res.configPath })
            } catch {}
          }
          await refreshMcpServers()
        } else {
          alert('该 Agent 没有可导入的 MCP Server 配置，或配置文件未找到。')
        }
      })
    })
  }

  async function refreshMcpServers() {
    try {
      const servers = await LiveFront.Services.mcp.listConnectedServers()
      renderMcpServers(Array.isArray(servers) ? servers : [])
    } catch (error) {
      serverTable.innerHTML = `<div class="settings-empty">刷新失败：${error.message}</div>`;
    }
  }

  function renderMcpServers(servers) {
    if (!servers.length) {
      serverTable.innerHTML = '<div class="settings-empty">暂无已连接的 MCP Server</div>'
      return
    }
    serverTable.innerHTML = `
      <div class="settings-table-header mcp-grid">
        <div>名称</div><div>状态</div><div>工具数</div><div>错误信息</div><div>来源</div><div>操作</div>
      </div>
      ${servers.map(server => `
        <div class="settings-table-row mcp-grid" data-status="${server.status}">
          <div>${server.name}</div>
          <div><span class="settings-status ${server.status === 'connected' ? 'active' : (server.status === 'error' ? 'error' : '')}">${server.status}</span></div>
          <div>${server.toolsCount ?? server.tools?.length ?? 0} 个</div>
          <div class="settings-secondary" title="${server.lastError || ''}">${server.lastError ? server.lastError.slice(0, 80) : '-'}</div>
          <div class="settings-secondary">${server.source || '-'}</div>
          <div class="settings-actions">
            <button class="btn btn-ghost" data-action="refresh-tools" data-name="${server.name}">刷新工具</button>
            <button class="btn btn-ghost danger" data-action="disconnect" data-name="${server.name}">断开</button>
          </div>
        </div>
      `).join('')}
    `
    serverTable.querySelectorAll('[data-action="disconnect"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await LiveFront.Services.mcp.disconnectServer(btn.dataset.name)
        await refreshMcpServers()
      })
    })
    serverTable.querySelectorAll('[data-action="refresh-tools"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await LiveFront.Services.mcp.listRemoteTools(btn.dataset.name)
        await refreshMcpServers()
      })
    })
  }

  let lastConfigPayload = null;
  async function refreshConfigPreview() {
    const config = await LiveFront.Services.mcp.getConfig();
    lastConfigPayload = config || null;
    if (!config) {
      configPreview.textContent = '未获取到配置';
      return;
    }
    configPreview.textContent = JSON.stringify(config, null, 2);
  }

  function buildExportPayload(format) {
    if (!lastConfigPayload) return '{}';
    if (format === 'claude') return JSON.stringify(lastConfigPayload.claudeDesktop || {}, null, 2);
    if (format === 'cursor') return JSON.stringify(lastConfigPayload.cursor || {}, null, 2);
    if (format === 'generic') return JSON.stringify(lastConfigPayload.generic || {}, null, 2);
    return JSON.stringify(lastConfigPayload, null, 2);
  }

  async function exportConfigToFile(format) {
    try {
      const payload = buildExportPayload(format);
      const filePath = await LiveFront.Services.dialog.saveFile([{ name: 'JSON', extensions: ['json'] }]);
      if (!filePath) return;
      await LiveFront.Services.fileSystem.writeFile(filePath, payload);
      alert('已导出配置');
    } catch (error) {
      alert('导出失败: ' + error.message);
    }
  }

  async function copyConfig(format) {
    try {
      await navigator.clipboard.writeText(buildExportPayload(format));
      alert('已复制到剪贴板');
    } catch (error) {
      alert('复制失败: ' + error.message);
    }
  }

  function statusIcon(status) {
    if (status === 'installed' || status === 'configured' || status === 'running') return '✅'
    return '⚠️'
  }

  scanBtn.addEventListener('click', refreshScanResults)
  container.querySelector('#mcpStartBtn').addEventListener('click', async () => {
    const settings = LiveFront.Services.settings.getAll()
    await LiveFront.Services.mcp.startServer(settings.mcp?.serverPort || 9528)
    await refreshConfigPreview()
  })
  container.querySelector('#mcpStopBtn').addEventListener('click', async () => {
    await LiveFront.Services.mcp.stopServer()
    await refreshConfigPreview()
  })
  container.querySelector('#mcpCopyClaude').addEventListener('click', () => copyConfig('claude'))
  container.querySelector('#mcpCopyCursor').addEventListener('click', () => copyConfig('cursor'))
  container.querySelector('#mcpCopyGeneric').addEventListener('click', () => copyConfig('generic'))
  container.querySelector('#mcpExportClaude').addEventListener('click', () => exportConfigToFile('claude'))
  container.querySelector('#mcpExportCursor').addEventListener('click', () => exportConfigToFile('cursor'))
  container.querySelector('#mcpExportGeneric').addEventListener('click', () => exportConfigToFile('generic'))

  async function openImportPreview(sourceName, filePath) {
    try {
      const config = await LiveFront.Services.fileSystem.readFile(filePath)
      const parsed = JSON.parse(config)
      const servers = parsed?.mcpServers || parsed?.mcp_servers || {}
      const entries = Object.entries(servers)
      const preview = container.querySelector('#mcpImportPreview')
      if (!entries.length) {
        preview.innerHTML = '<div class="settings-empty">未在配置中发现可用 Server</div>'
        return
      }
      preview.innerHTML = `
        <div class="settings-table">
          <div class="settings-table-header mcp-grid">
            <div>名称</div><div>传输</div><div>命令 / URL</div><div>导入</div>
          </div>
          ${entries.map(([name, value]) => `
            <div class="settings-table-row mcp-grid">
              <div>${name}</div>
              <div><span class="settings-tag">${value.url ? 'http' : 'stdio'}</span></div>
              <div class="settings-secondary">${value.url || value.command || '-'}</div>
              <div><label class="settings-radio"><input type="checkbox" data-import-name="${name}" checked /><span>选择</span></label></div>
            </div>
          `).join('')}
        </div>
        <div class="settings-row" style="justify-content:flex-end; gap:8px; margin-top:8px;">
          <button class="btn btn-ghost" id="mcpImportCancelPreview">取消</button>
          <button class="btn btn-primary" id="mcpImportConfirmPreview">导入选中 Server</button>
        </div>
      `
      preview.querySelector('#mcpImportCancelPreview').addEventListener('click', () => {
        preview.innerHTML = ''
      })
      preview.querySelector('#mcpImportConfirmPreview').addEventListener('click', async () => {
        const selected = [...preview.querySelectorAll('[data-import-name]:checked')].map(el => el.dataset.importName)
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

  container.querySelector('#mcpAddServerBtn').addEventListener('click', async () => {
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
  const settings = LiveFront.Services.settings.getAll()
  startAgentRefresh(settings.mcp?.refreshIntervalMs || 5000)
}

function renderDialogs(container) {
  const settings = LiveFront.Services.settings.getAll()
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">对话管理</div>
      <div class="settings-hint">这里显示基础的对话管理能力，后续会接入更完整的对话列表。</div>
      <div class="settings-row">
        <div class="settings-label">已配置对话数</div>
        <div class="settings-control">
          <span>${(settings.dialogs || []).length}</span>
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
      <div class="settings-hint">编辑器设置占位，后续可扩展字号、主题、自动保存等选项。</div>
    </div>
  `
}

function renderPreviewSettings(container) {
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">预览设置</div>
      <div class="settings-hint">预览设置占位，后续可扩展默认视口、刷新策略等。</div>
    </div>
  `
}

function renderTerminalSettings(container) {
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">终端设置</div>
      <div class="settings-hint">终端设置占位，后续可扩展默认 Shell 和字号。</div>
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
