/* LiveFront AI 模块 */
(function () {
  // No preset providers - user adds their own
  const PROVIDERS = {}

  const PROVIDERS_STORAGE_KEY = 'livefront_ai_providers'
  const HISTORY_STORAGE_KEY = 'livefront_ai_history'

  // ── AI 状态 ──
  const AIState = {
    provider: '',
    model: '',
    apiKey: '',
    messages: [], // { role, content }
    isStreaming: false,
    attachContext: true
  }

  // ── Provider 存储（localStorage） ──
  function getProvidersStore() {
    try {
      const raw = localStorage.getItem(PROVIDERS_STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  }

  function setProvidersStore(obj) {
    localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(obj))
  }

    // User model storage (flat list of {id, name, baseUrl, apiKey, modelId})
  function getUserModels() {
    try {
      const raw = localStorage.getItem('livefront_ai_models')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  function setUserModels(models) {
    localStorage.setItem('livefront_ai_models', JSON.stringify(models))
  }

  function getProviderKey(providerId) {
    const models = getUserModels()
    const m = models.find(x => x.baseUrl === providerId || x.id === providerId)
    return m?.apiKey || ''
  }

  function setProviderKey(providerId, apiKey) {
    // No-op, use setUserModels directly
  }

  function deleteProviderKey(providerId) {
    // No-op, use setUserModels directly
  }

  // 从旧的 per-key 存储迁移
  function migrateOldKeys() {
    // Migrate from old per-provider storage to new flat model storage
    const oldStore = getProvidersStore()
    if (oldStore && Object.keys(oldStore).length > 0 && !localStorage.getItem('livefront_ai_models')) {
      // If old store has data, try to migrate the first configured provider
      for (const [pid, val] of Object.entries(oldStore)) {
        if (val?.apiKey) {
          const model = {
            id: Date.now().toString(),
            name: pid,
            baseUrl: '',
            apiKey: val.apiKey,
            modelId: ''
          }
          const models = [model]
          localStorage.setItem('livefront_ai_models', JSON.stringify(models))
          AIState.provider = model.baseUrl
          AIState.model = model.modelId
          AIState.apiKey = model.apiKey
          break
        }
      }
    }
    localStorage.removeItem(PROVIDERS_STORAGE_KEY)
  }

  function hasAnyProviderKey() {
    const models = getUserModels()
    return models.some(m => m.apiKey)
  }

  // ── 加载/保存设置 ──
  function loadSettings() {
    migrateOldKeys()
    const models = getUserModels()
    const activeId = localStorage.getItem('livefront_ai_active_model')
    const active = models.find(m => m.id === activeId) || models[0]
    if (active) {
      AIState.provider = active.baseUrl
      AIState.model = active.modelId
      AIState.apiKey = active.apiKey
    }
    AIState.attachContext = LiveFront.Storage.get('ai_attach_context', true)
  }

  function saveSettings() {
    LiveFront.Storage.set('ai_attach_context', AIState.attachContext)
  }

  // ── 消息历史持久化 ──
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (raw) AIState.messages = JSON.parse(raw)
    } catch { /* ignore */ }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(AIState.messages))
    } catch { /* ignore */ }
  }

  function clearHistory() {
    AIState.messages = []
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }

  // ── 构建上下文 ──
  function buildContext() {
    if (!AIState.attachContext) return ''
    let ctx = ''
    const projectPath = LiveFront.state.currentProjectPath
    if (projectPath) ctx += '当前项目: ' + projectPath.split(/[/\\]/).pop() + '\n'
    const openFiles = LiveFront.Editor?.getOpenFiles() || []
    if (openFiles.length > 0) {
      const active = LiveFront.Editor?.getActivePath()
      const entry = active ? LiveFront.Editor.getEntry(active) : null
      if (entry) {
        ctx += '当前打开的文件: ' + entry.name + ' (' + entry.languageDisplay + ')\n'
        const content = entry.model.getValue()
        if (content.length < 8000) {
          ctx += '文件内容:\n```' + entry.language + '\n' + content + '\n```\n'
        } else {
          ctx += '文件内容: (过长，已省略，共 ' + content.length + ' 字符)\n'
        }
      }
    }
    const sel = LiveFront.state.selectedElement
    if (sel) {
      ctx += '当前选中元素: <' + sel.tagName.toLowerCase()
      if (sel.id) ctx += ' id="' + sel.id + '"'
      if (sel.className && typeof sel.className === 'string' && sel.className.trim()) {
        ctx += ' class="' + sel.className.trim() + '"'
      }
      ctx += '>\n'
      if (sel.computedStyles) {
        const s = sel.computedStyles
        ctx += '当前样式: color:' + s.color + ', background:' + s.backgroundColor + ', font-size:' + s.fontSize + ', display:' + s.display + '\n'
      }
    }
    const modTags = LiveFront.ModStore?.getTags() || []
    if (modTags.length > 0) {
      ctx += '已进行的修改:\n' + modTags.map((t, i) => '  ' + (i+1) + '. ' + t.label).join('\n') + '\n'
    }
    return ctx
  }

  // ── 简易语法高亮 ──
  function highlightCode(code, lang) {
    let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const isJS = ['js', 'javascript', 'jsx', 'tsx', 'ts', 'typescript'].includes(lang)
    const isCSS = ['css', 'scss', 'less'].includes(lang)
    const isHTML = ['html', 'htm', 'xml', 'svg'].includes(lang)

    // 注释
    escaped = escaped.replace(/(\/\/.*?)(\n|$)/g, '<span class="tk-cmt">$1</span>$2')
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tk-cmt">$1</span>')
    escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tk-cmt">$1</span>')

    // 字符串
    escaped = escaped.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, '<span class="tk-str">$&</span>')

    // 数字
    escaped = escaped.replace(/\b(\d+\.?\d*)(px|em|rem|%|vh|vw|deg|s|ms)?\b/g, '<span class="tk-num">$&</span>')

    // 关键字
    if (isJS) {
      const jsKw = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|null|undefined|true|false)\b/g
      escaped = escaped.replace(jsKw, '<span class="tk-kw">$1</span>')
    } else if (isCSS) {
      const cssKw = /\b(display|flex|grid|position|absolute|relative|fixed|sticky|margin|padding|border|background|color|font-size|font-weight|font-family|width|height|min-width|max-width|min-height|max-height|overflow|z-index|transition|transform|animation|opacity|box-shadow|text-align|justify-content|align-items|gap|cursor|important)\b/g
      escaped = escaped.replace(cssKw, '<span class="tk-kw">$1</span>')
    } else if (isHTML) {
      // HTML tag names
      escaped = escaped.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tk-tag">$2</span>')
      // attributes
      escaped = escaped.replace(/\b([\w-]+)(=)/g, '<span class="tk-attr">$1</span>$2')
    }

    return escaped
  }

  // ── 渲染消息 ──
  function renderMessages(container) {
    container.innerHTML = ''

    if (AIState.messages.length === 0) {
      const welcome = document.createElement('div')
      welcome.className = 'ai-msg ai-msg-system'
      welcome.innerHTML = '你好！我是 LiveFront AI 助手。<br>我可以帮助你生成和修改前端代码。<br>当前会自动附带你正在编辑的文件内容。<br><br>提示：选中预览区的元素后发送消息，AI 会知道你在操作哪个元素。'
      container.appendChild(welcome)
      return
    }

    for (const msg of AIState.messages) {
      const bubble = document.createElement('div')
      bubble.className = 'ai-msg ' + (msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-ai')
      if (msg.role === 'assistant' && !msg.content) {
        // 加载动画占位
        bubble.innerHTML = '<div class="ai-loading"><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div></div>'
      } else {
        bubble.innerHTML = renderContent(msg.content)
      }
      container.appendChild(bubble)
    }

    container.scrollTop = container.scrollHeight
  }

  // ── 渲染 AI 回复内容（Markdown 简易渲染） ──
  function renderContent(text) {
    if (!text) return ''
    // 代码块
    let html = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const langLabel = lang || 'text'
      const highlighted = highlightCode(code, langLabel.toLowerCase())
      return '<div class="ai-code-block">'
        + '<div class="ai-code-header">'
        + '  <span>' + langLabel + '</span>'
        + '  <div class="ai-code-actions">'
        + '    <button class="ai-code-btn" onclick="LiveFront.AI.copyCode(this)" data-code="' + encodeURIComponent(code) + '">复制</button>'
        + '  </div>'
        + '</div>'
        + '<pre class="ai-code-content">' + highlighted + '</pre>'
        + '</div>'
    })

    // 应用全部按钮（如果包含代码块）
    const hasCode = text.match(/```(\w*)\n([\s\S]*?)```/g)
    if (hasCode) {
      html += '<div class="ai-apply-all-row">'
        + '<button class="ai-code-btn ai-code-btn-apply" onclick="LiveFront.AI.applyAll(this)">应用全部</button>'
        + '</div>'
    }

    // 简单 markdown
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\n/g, '<br>')
    return html
  }

  // ── 发送消息 ──
  async function sendMessage(userText) {
    if (!userText.trim() || AIState.isStreaming) return
    if (!AIState.apiKey) {
      AIState.messages.push({ role: 'system', content: '请先配置 API Key（点击设置按钮）' })
      const messagesEl = document.getElementById('aiMessages')
      if (messagesEl) renderMessages(messagesEl)
      return
    }

    const context = buildContext()
    AIState.messages.push({ role: 'user', content: context ? context + '\n---\n' + userText : userText })
    saveHistory()

    const messagesEl = document.getElementById('aiMessages')
    if (messagesEl) renderMessages(messagesEl)

    AIState.isStreaming = true
    updateSendBtn()

    // 构建 system message
    const contextText = buildContext()
    const systemPrompt = '你是 LiveFront 的 AI 助手，帮助用户编写和修改前端代码。\n'
      + '直接输出可运行的代码，使用 markdown 代码块格式。\n'
      + '如果需要修改文件，请在代码块前说明修改了什么。\n'
      + (contextText ? '\n' + contextText : '')

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...AIState.messages.filter(m => m.role !== 'system')
    ]

    // Append placeholder for AI response
    AIState.messages.push({ role: 'assistant', content: '' })
    const aiMsgIndex = AIState.messages.length - 1
    if (messagesEl) renderMessages(messagesEl)

    try {
      const provider = AIState.provider
      const result = await LiveFront.Services.ai.request({
        provider,
        apiKey: AIState.apiKey,
        model: AIState.model,
        messages: apiMessages,
        maxTokens: 4096
      })

      if (result?.error) {
        AIState.messages[aiMsgIndex].content = '错误: ' + result.error
      } else {
        AIState.messages[aiMsgIndex].content = result?.content || '(空回复)'
      }
    } catch (e) {
      AIState.messages[aiMsgIndex].content = '请求失败: ' + e.message
    }

    AIState.isStreaming = false
    updateSendBtn()
    saveHistory()
    if (messagesEl) renderMessages(messagesEl)
  }

  function updateSendBtn() {
    const btn = document.getElementById('aiSendBtn')
    if (btn) btn.disabled = AIState.isStreaming
  }

  // ── 代码应用 ──
  function applyCodeFromAI(code, lang) {
    const projectPath = LiveFront.state.currentProjectPath
    if (!projectPath) return Promise.resolve()

    const openFiles = LiveFront.Editor?.getOpenFiles() || []
    let targetPath = null

    if (lang === 'css' || lang === 'scss' || lang === 'less') {
      const cssFile = openFiles.find(f => f.language === 'css' || f.name.endsWith('.css'))
      targetPath = cssFile?.path
    } else if (lang === 'html' || lang === 'htm') {
      const htmlFile = openFiles.find(f => f.language === 'html' || f.name.endsWith('.html'))
      targetPath = htmlFile?.path
    } else if (lang === 'javascript' || lang === 'js') {
      const jsFile = openFiles.find(f => f.language === 'javascript' || f.name.endsWith('.js'))
      targetPath = jsFile?.path
    }

    if (!targetPath && openFiles.length > 0) {
      targetPath = LiveFront.Editor?.getActivePath() || openFiles[0]?.path
    }

    if (!targetPath) return Promise.resolve()

    return LiveFront.Services.fileSystem.writeFile(targetPath, code).then(() => {
      const entry = LiveFront.Editor?.getEntry(targetPath)
      if (entry) entry.model.setValue(code)
      LiveFront.Preview?.refresh()
      LiveFront.EventBus.emit('file:saved', { path: targetPath })
      LiveFront.EventBus.emit('modification:created', {
        label: 'AI: 应用代码到 ' + targetPath.split(/[/\\]/).pop(),
        source: 'ai',
        bindFilePath: targetPath
      })
    })
  }

  // ── 解析所有代码块 ──
  function parseCodeBlocks(text) {
    const blocks = []
    const re = /```(\w*)\n([\s\S]*?)```/g
    let m
    while ((m = re.exec(text)) !== null) {
      blocks.push({ lang: m[1] || '', code: m[2] })
    }
    return blocks
  }

  // ── 模块注册 ──
  LiveFront.modules.register({
    id: 'ai',
    name: 'AI',
    version: '0.2.0',
    description: 'AI 对话和代码生成',

    dependencies: [],
    optionalDependencies: ['editor', 'preview', 'modline'],

    ui: {},
    commands: [
      { id: 'ai.openPanel', label: '打开 AI 面板', category: 'AI' }
    ],
    shortcuts: [
      { key: 'Ctrl+Shift+A', command: 'ai.openPanel' }
    ],
    menus: [
      {
        menuPath: '工具',
        items: [
          { label: '打开 AI 对话', command: 'ai.openPanel', shortcut: 'Ctrl+Shift+A' }
        ]
      }
    ],
    contextMenus: [
      {
        target: 'editor',
        items: [
          { label: 'AI: 解释选中代码', command: 'ai.explainSelection' },
          { label: 'AI: 重构选中代码', command: 'ai.refactorSelection' },
          { label: 'AI: 添加注释', command: 'ai.addComments' }
        ]
      }
    ],

    events: {
      emits: [
        { name: 'ai:response', payload: '{ content }' },
        { name: 'modification:created', payload: '{ label, source }' }
      ],
      listens: []
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx
      loadSettings()
      loadHistory()

      ctx.commands.register('ai.openPanel', () => {
        LiveFront.PanelManager?.activateTab('ai')
      })

      // AI 选中操作命令
      const aiActions = {
        'ai.explainSelection': '请解释以下选中的代码',
        'ai.refactorSelection': '请重构以下选中的代码，改善可读性和性能',
        'ai.addComments': '请为以下选中的代码添加详细的中文注释'
      }
      for (const [cmdId, prompt] of Object.entries(aiActions)) {
        ctx.commands.register(cmdId, () => {
          const editor = LiveFront.Editor?.getActiveEditor()
          if (!editor) return
          const selection = editor.getModel()?.getValueInRange(editor.getSelection())
          if (!selection) return
          LiveFront.PanelManager?.activateTab('ai')
          setTimeout(() => {
            sendMessage(prompt + ':\n```\n' + selection + '\n```')
          }, 200)
        })
      }

      // 监听修改线发送到 AI 的事件
      ctx.eventBus.on('modline:send-to-ai', (data) => {
        LiveFront.PanelManager?.activateTab('ai')
        setTimeout(() => {
          sendMessage(data.message)
        }, 200)
      })

      // 注册到面板管理器
      if (LiveFront.PanelManager) {
        LiveFront.PanelManager.registerTab({
          id: 'ai',
          label: 'AI',
          icon: '',
          render: (container) => {
            // 根据是否有配置决定显示设置或对话
            if (!hasAnyProviderKey()) {
              this._showSettings(container)
            } else {
              this._renderPanel(container)
            }
          }
        })
      }

      console.log('[AI] Module initialized')
    },

    _renderPanel(container) {
      container.innerHTML = ''
      const panel = document.createElement('div')
      panel.className = 'ai-panel'

      // 头部
      const header = document.createElement('div')
      header.className = 'ai-header'
      header.innerHTML = ''
        + '<div class="ai-header-left">AI 对话</div>'
        + '<div class="ai-header-right">'
        + '  <select class="ai-model-select" id="aiModelSelect">'
        + Object.values(PROVIDERS).flatMap(p => p.models.map(m =>
          '<option value="' + p.id + ':' + m.id + '"'
          + (AIState.provider === p.id && AIState.model === m.id ? ' selected' : '')
          + '>' + p.name + ' ' + m.name + '</option>'
        )).join('')
        + '  </select>'
        + '  <button class="ai-settings-btn" id="aiSettingsBtn" title="设置">×</button>'
        + '</div>'
      panel.appendChild(header)

      // 当前文件指示器
      const activeFile = document.createElement('div')
      activeFile.className = 'ai-active-file'
      activeFile.id = 'aiActiveFile'
      this._updateActiveFile(activeFile)
      panel.appendChild(activeFile)

      // 消息区
      const messages = document.createElement('div')
      messages.className = 'ai-messages'
      messages.id = 'aiMessages'
      panel.appendChild(messages)
      renderMessages(messages)

      // 输入区
      const inputArea = document.createElement('div')
      inputArea.className = 'ai-input-area'

      const contextToggle = document.createElement('label')
      contextToggle.className = 'ai-context-toggle'
      contextToggle.innerHTML = '<input type="checkbox" id="aiContextToggle" ' + (AIState.attachContext ? 'checked' : '') + '> 附加当前文件上下文'
      inputArea.appendChild(contextToggle)

      const inputRow = document.createElement('div')
      inputRow.className = 'ai-input-row'

      const textarea = document.createElement('textarea')
      textarea.className = 'ai-input'
      textarea.id = 'aiInput'
      textarea.placeholder = '输入消息... (Enter 发送，Shift+Enter 换行)'
      textarea.rows = 1
      inputRow.appendChild(textarea)

      const sendBtn = document.createElement('button')
      sendBtn.className = 'ai-send-btn'
      sendBtn.id = 'aiSendBtn'
      sendBtn.textContent = '▶'
      sendBtn.title = '发送'
      inputRow.appendChild(sendBtn)

      inputArea.appendChild(inputRow)

      // 清空对话按钮
      const actionsRow = document.createElement('div')
      actionsRow.className = 'ai-input-actions'
      const clearBtn = document.createElement('button')
      clearBtn.className = 'ai-clear-btn'
      clearBtn.textContent = '清空对话'
      clearBtn.addEventListener('click', () => {
        if (AIState.messages.length === 0) return
        if (!confirm('确定清空对话历史？')) return
        clearHistory()
        const messagesEl = document.getElementById('aiMessages')
        if (messagesEl) renderMessages(messagesEl)
      })
      actionsRow.appendChild(clearBtn)
      inputArea.appendChild(actionsRow)

      panel.appendChild(inputArea)
      container.appendChild(panel)

      // 事件绑定
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          const text = textarea.value
          textarea.value = ''
          sendMessage(text)
        }
      })
      sendBtn.addEventListener('click', () => {
        const text = textarea.value
        textarea.value = ''
        sendMessage(text)
      })

      document.getElementById('aiModelSelect')?.addEventListener('change', (e) => {
        const [prov, model] = e.target.value.split(':')
        AIState.provider = prov
        AIState.model = model
        AIState.apiKey = getProviderKey(prov)
        saveSettings()
      })

      document.getElementById('aiContextToggle')?.addEventListener('change', (e) => {
        AIState.attachContext = e.target.checked
        saveSettings()
      })

      document.getElementById('aiSettingsBtn')?.addEventListener('click', () => {
        this._showSettings(container)
      })

      // 监听编辑器切换文件
      this._fileSwitchHandler = () => {
        const el = document.getElementById('aiActiveFile')
        if (el) this._updateActiveFile(el)
      }
      LiveFront.EventBus.on('editor:file-switched', this._fileSwitchHandler)
    },

    _updateActiveFile(el) {
      const active = LiveFront.Editor?.getActivePath()
      if (active) {
        const entry = LiveFront.Editor.getEntry(active)
        el.innerHTML = '当前文件: ' + (entry?.name || active.split(/[/\\]/).pop())
      } else {
        el.innerHTML = '当前文件: (无)'
      }
    },

    _showSettings(container) {
      container.innerHTML = ''
      const settings = document.createElement('div')
      settings.className = 'ai-settings'

      const models = getUserModels()

      let html = '<h3>AI 模型设置</h3>'

      // Quick-config presets
      const PRESETS = [
        { id: 'mimo', label: 'MiMo AI Studio', name: 'MiMo AI Studio', baseUrl: 'https://aistudio.xiaomimimo.com/v1', modelId: 'mimo-v2.5-pro' },
        { id: 'deepseek', label: 'DeepSeek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', modelId: 'deepseek-chat' },
      ]

      html += '<div style="margin-bottom:16px;">'
        + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">快速配置</div>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      for (const preset of PRESETS) {
        html += '<button class="ai-preset-btn" data-preset="' + preset.id + '" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-secondary);cursor:pointer;font-size:12px;color:var(--text);transition:all 0.15s;">'
          + preset.label + '</button>'
      }
      html += '</div></div>'

      // Add model form
      html += '<div style="border-top:1px solid var(--border);padding-top:12px;">'
      html += '<div class="ai-settings-group">'
        + '<label>名称：</label>'
        + '<input type="text" id="aiModelName" placeholder="如：MiMo AI Studio">'
        + '</div>'
      html += '<div class="ai-settings-group">'
        + '<label>API 地址：</label>'
        + '<input type="text" id="aiModelBaseUrl" placeholder="如：https://aistudio.xiaomimimo.com/v1">'
        + '<div style="font-size:10px;color:var(--text-muted);">API 端点（OpenAI 兼容格式）</div>'
        + '</div>'
      html += '<div class="ai-settings-group">'
        + '<label>API Key：</label>'
        + '<input type="password" id="aiModelApiKey" placeholder="sk-...">'
        + '<div style="font-size:10px;color:var(--text-muted);">本地存储，不会上传。</div>'
        + '</div>'
      html += '<div class="ai-settings-group">'
        + '<label>模型 ID：</label>'
        + '<input type="text" id="aiModelId" placeholder="如：mimo-v2.5-pro, deepseek-chat">'
        + '</div>'

      html += '<div style="margin-top:12px;">'
        + '<button class="btn btn-primary" id="aiModelAdd" style="width:100%;">添加模型</button>'
        + '</div>'
      html += '</div>'

      // Configured models list
      html += '<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">'
        + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">已配置的模型</div>'

      if (models.length === 0) {
        html += '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">尚未配置任何模型</div>'
      }

      const activeId = localStorage.getItem('livefront_ai_active_model')
      for (const m of models) {
        const isActive = m.id === activeId
        html += '<div class="ai-provider-row">'
          + '<span>' + (isActive ? '&#9654;' : '&#9675;') + ' ' + (m.name || '未命名') + ' <span style="opacity:0.5;font-size:10px;">' + (m.modelId || '') + '</span></span>'
          + '<div class="ai-provider-actions">'
          + (isActive ? '' : '<button class="ai-provider-btn" data-action="activate" data-id="' + m.id + '">使用</button>')
          + '<button class="ai-provider-btn ai-provider-btn-danger" data-action="delete-model" data-id="' + m.id + '">删除</button>'
          + '</div>'
          + '</div>'
      }
      html += '</div>'

      settings.innerHTML = html
      container.appendChild(settings)

      // Preset quick-config buttons
      settings.querySelectorAll('.ai-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const presetId = btn.dataset.preset
          const preset = PRESETS.find(p => p.id === presetId)
          if (!preset) return
          settings.querySelector('#aiModelName').value = preset.name
          settings.querySelector('#aiModelBaseUrl').value = preset.baseUrl
          settings.querySelector('#aiModelId').value = preset.modelId
          settings.querySelector('#aiModelApiKey').value = ''
          settings.querySelector('#aiModelApiKey').focus()
          // Highlight active preset
          settings.querySelectorAll('.ai-preset-btn').forEach(b => {
            b.style.borderColor = b.dataset.preset === presetId ? 'var(--primary)' : 'var(--border)'
            b.style.background = b.dataset.preset === presetId ? 'var(--primary-dim, rgba(74,108,247,0.1))' : 'var(--bg-secondary)'
          })
        })
      })

      // Add model
      settings.querySelector('#aiModelAdd')?.addEventListener('click', () => {
        const name = settings.querySelector('#aiModelName').value.trim()
        const baseUrl = settings.querySelector('#aiModelBaseUrl').value.trim()
        const apiKey = settings.querySelector('#aiModelApiKey').value.trim()
        const modelId = settings.querySelector('#aiModelId').value.trim()

        if (!baseUrl || !apiKey) {
          if (!baseUrl) settings.querySelector('#aiModelBaseUrl').style.borderColor = 'var(--danger)'
          if (!apiKey) settings.querySelector('#aiModelApiKey').style.borderColor = 'var(--danger)'
          return
        }

        const model = { id: Date.now().toString(), name: name || modelId || '模型', baseUrl, apiKey, modelId }
        const models = getUserModels()
        models.push(model)
        setUserModels(models)

        AIState.provider = model.baseUrl
        AIState.model = model.modelId
        AIState.apiKey = model.apiKey
        localStorage.setItem('livefront_ai_active_model', model.id)

        this._showSettings(container)
      })

      // Activate model
      settings.querySelectorAll('[data-action="activate"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id
          const models = getUserModels()
          const m = models.find(x => x.id === id)
          if (!m) return
          AIState.provider = m.baseUrl
          AIState.model = m.modelId
          AIState.apiKey = m.apiKey
          localStorage.setItem('livefront_ai_active_model', m.id)
          this._showSettings(container)
        })
      })

      // Delete model
      settings.querySelectorAll('[data-action="delete-model"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id
          let models = getUserModels()
          const m = models.find(x => x.id === id)
          if (!m) return
          if (!confirm('确认删除模型 "' + (m.name || m.modelId) + '" 吗？')) return
          models = models.filter(x => x.id !== id)
          setUserModels(models)
          if (localStorage.getItem('livefront_ai_active_model') === id) {
            localStorage.removeItem('livefront_ai_active_model')
            const first = models[0]
            if (first) {
              AIState.provider = first.baseUrl
              AIState.model = first.modelId
              AIState.apiKey = first.apiKey
              localStorage.setItem('livefront_ai_active_model', first.id)
            } else {
              AIState.provider = ''
              AIState.model = ''
              AIState.apiKey = ''
            }
          }
          this._showSettings(container)
        })
      })
    },

    destroy() {
      if (this._fileSwitchHandler) {
        LiveFront.EventBus.off('editor:file-switched', this._fileSwitchHandler)
      }
      AIState.messages = []
    }
  })

  // 暴露全局 API
  window.LiveFront.AI = {
    copyCode(btn) {
      const code = decodeURIComponent(btn.dataset.code || '')
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = '已复制'
        setTimeout(() => { btn.textContent = '复制' }, 1500)
      })
    },
    applyAll(btn) {
      // 找到最近的 AI 消息气泡，解析所有代码块
      const bubble = btn.closest('.ai-msg-ai')
      if (!bubble) return
      const contentEl = bubble.querySelector('.ai-code-content')
      // 回退：从原始消息内容中提取
      const msgIndex = Array.from(bubble.parentElement.children).indexOf(bubble)
      // 简单方式：遍历该气泡内所有代码块
      const codeBlocks = bubble.querySelectorAll('.ai-code-block')
      if (codeBlocks.length === 0) return

      const applyNext = (i) => {
        if (i >= codeBlocks.length) return
        const block = codeBlocks[i]
        const lang = block.querySelector('.ai-code-header span')?.textContent || ''
        const rawCode = block.querySelector('.ai-code-content')?.textContent || ''
        applyCodeFromAI(rawCode, lang.toLowerCase()).then(() => {
          applyNext(i + 1)
        })
      }
      applyNext(0)

      btn.textContent = '已应用'
      setTimeout(() => { btn.textContent = '应用全部' }, 1500)
    },
    sendMessage,
    AIState
  }
})()
