/* LiveFront ModLine — 修改线管理 */
(function () {
  // ============ 快照栈 ============
  const SnapshotStack = {
    _snapshots: [],
    _version: 0,

    async saveSnapshot(label) {
      const projectPath = LiveFront.state.currentProjectPath
      if (!projectPath) return null
      const files = {}
      const openFiles = LiveFront.Editor?.getOpenFiles() || []
      for (const entry of openFiles) {
        files[entry.path] = entry.model.getValue()
      }
      const snap = {
        version: ++this._version,
        label: label || 'v' + this._version,
        timestamp: Date.now(),
        files
      }
      this._snapshots.push(snap)
      return snap
    },

    getSnapshot(version) {
      return this._snapshots.find(s => s.version === version) || null
    },

    getLatest() {
      return this._snapshots.length > 0 ? this._snapshots[this._snapshots.length - 1] : null
    },

    async restoreSnapshot(version) {
      const snap = this.getSnapshot(version)
      if (!snap) return false
      for (const [filePath, content] of Object.entries(snap.files)) {
        await LiveFront.Services.fileSystem.writeFile(filePath, content)
        const entry = LiveFront.Editor?.getEntry(filePath)
        if (entry) entry.model.setValue(content)
      }
      LiveFront.Preview?.refresh()
      return true
    },

    clear() {
      this._snapshots = []
      this._version = 0
    }
  }

  // ============ AI 辅助函数 ============
  function _checkAIConfigured() {
    const raw = localStorage.getItem('livefront_ai_providers')
    if (!raw) return false
    try {
      const store = JSON.parse(raw)
      return Object.values(store).some(p => p?.apiKey)
    } catch { return false }
  }

  function _getFirstConfiguredProvider() {
    const raw = localStorage.getItem('livefront_ai_providers')
    if (!raw) return null
    try {
      const store = JSON.parse(raw)
      for (const [id, cfg] of Object.entries(store)) {
        if (cfg?.apiKey) return { id, apiKey: cfg.apiKey }
      }
    } catch { /* ignore */ }
    return null
  }

  function _showAIConfigPrompt() {
    const overlay = document.createElement('div')
    overlay.className = 'modline-dialog-overlay'
    overlay.innerHTML = `
      <div class="modline-dialog">
        <h3>⚠️ AI 未配置</h3>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;">
          使用修改线发送功能前，请先在 AI 面板中配置至少一个 AI 提供商的 API Key。
        </p>
        <div class="modline-dialog-actions">
          <button class="btn btn-ghost" id="_aiPromptCancel">取消</button>
          <button class="btn btn-primary" id="_aiPromptGo">前往 AI 面板</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    overlay.querySelector('#_aiPromptCancel').addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
    overlay.querySelector('#_aiPromptGo').addEventListener('click', () => {
      overlay.remove()
      // 切换到 AI Tab
      LiveFront.EventBus.emit('ui:switch-tab', { tab: 'ai' })
      _showToast('请在 AI 面板中配置 API Key')
    })
  }

  function _buildModlineSystemMessage(tags) {
    let sys = '你是 LiveFront 的 AI 助手，帮助用户根据修改线中的要求修改前端代码。\n'
    sys += '请根据修改要求生成代码变更，使用 markdown 代码块格式输出。\n'
    sys += '如果修改 CSS，在代码块前说明修改了哪个文件的哪个选择器。\n'
    sys += '如果修改 HTML，在代码块前说明修改了哪个文件。\n'
    sys += '如果修改 JavaScript，在代码块前说明修改了哪个文件。\n\n'

    // 当前文件内容
    const openFiles = LiveFront.Editor?.getOpenFiles() || []
    if (openFiles.length > 0) {
      const active = LiveFront.Editor?.getActivePath()
      const entry = active ? LiveFront.Editor.getEntry(active) : null
      if (entry) {
        sys += '当前打开的文件: ' + entry.name + ' (' + entry.languageDisplay + ')\n'
        const content = entry.model.getValue()
        if (content.length < 12000) {
          sys += '文件内容:\n```' + entry.language + '\n' + content + '\n```\n\n'
        } else {
          sys += '文件内容: (过长，已省略，共 ' + content.length + ' 字符)\n\n'
        }
      }
    }

    // 项目结构
    const projectPath = LiveFront.state.currentProjectPath
    if (projectPath) {
      sys += '当前项目: ' + projectPath.split(/[/\\]/).pop() + '\n'
      const tree = LiveFront.state.projectTree
      if (tree) {
        sys += '项目结构:\n' + _flattenTree(tree, 0).join('\n') + '\n\n'
      }
    }

    // 标签状态列表
    if (tags && tags.length > 0) {
      sys += '修改线状态:\n'
      tags.forEach((t, i) => {
        sys += '  ' + (i + 1) + '. [' + t.status + '] ' + t.label
        if (t.bindSelector) sys += ' (目标元素: ' + t.bindSelector + ')'
        if (t.detail) sys += '\n     详细说明: ' + t.detail
        sys += '\n'
      })
    }

    return sys
  }

  function _flattenTree(node, depth) {
    const lines = []
    const indent = '  '.repeat(depth)
    if (node.name) {
      lines.push(indent + (node.type === 'directory' ? '📁 ' : '📄 ') + node.name)
    }
    if (node.children) {
      for (const child of node.children) {
        lines.push(..._flattenTree(child, depth + 1))
      }
    }
    return lines
  }

  async function _callAI(userMessage, systemMessage) {
    const provider = _getFirstConfiguredProvider()
    if (!provider) throw new Error('AI 未配置')

    const PROVIDERS = {
      deepseek: { models: [{ id: 'deepseek-chat' }] },
      openai: { models: [{ id: 'gpt-4o' }] },
      claude: { models: [{ id: 'claude-sonnet-4-20250514' }] }
    }
    const model = PROVIDERS[provider.id]?.models[0]?.id || 'deepseek-chat'

    const apiMessages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ]

    const result = await LiveFront.Services.ai.request({
      provider: provider.id,
      apiKey: provider.apiKey,
      model,
      messages: apiMessages,
      maxTokens: 4096
    })

    if (result?.error) throw new Error(result.error)
    if (!result?.content) throw new Error('AI 未返回有效内容')
    return result.content
  }

  function _parseCodeBlocks(text) {
    const blocks = []
    const re = /```(\w*)\n([\s\S]*?)```/g
    let m
    while ((m = re.exec(text)) !== null) {
      blocks.push({ lang: m[1] || '', code: m[2].trim() })
    }
    return blocks
  }

  async function _applyCodeBlocks(codeBlocks) {
    const projectPath = LiveFront.state.currentProjectPath
    if (!projectPath) throw new Error('未打开项目')

    const openFiles = LiveFront.Editor?.getOpenFiles() || []

    for (const block of codeBlocks) {
      const lang = block.lang.toLowerCase()
      let targetPath = null

      if (['css', 'scss', 'less'].includes(lang)) {
        const cssFile = openFiles.find(f => f.language === 'css' || f.name.endsWith('.css'))
        targetPath = cssFile?.path
      } else if (['html', 'htm'].includes(lang)) {
        const htmlFile = openFiles.find(f => f.language === 'html' || f.name.endsWith('.html'))
        targetPath = htmlFile?.path
      } else if (['javascript', 'js', 'jsx', 'tsx', 'ts', 'typescript'].includes(lang)) {
        const jsFile = openFiles.find(f => f.language === 'javascript' || f.name.endsWith('.js'))
        targetPath = jsFile?.path
      }

      // 回退到当前活动文件
      if (!targetPath && openFiles.length > 0) {
        targetPath = LiveFront.Editor?.getActivePath() || openFiles[0]?.path
      }

      if (targetPath) {
        await LiveFront.Services.fileSystem.writeFile(targetPath, block.code)
        const entry = LiveFront.Editor?.getEntry(targetPath)
        if (entry) entry.model.setValue(block.code)
      }
    }

    // 刷新预览
    LiveFront.Preview?.refresh()
  }

  // ============ Summary & Send-to-Dialog ============
  function generateModlineSummary() {
    const tags = ModStore.getTags()
    const projectPath = LiveFront.state.currentProjectPath
    const projectName = projectPath ? projectPath.split(/[\/\\]/).pop() : 'current project'
    const openFiles = LiveFront.Editor?.getOpenFiles() || []
    const activePath = LiveFront.Editor?.getActivePath()
    const timestamp = new Date().toLocaleString('zh-CN')

    const changed = tags.filter(t => t.status === 'applied' || t.status === 'done')
    const pending = tags.filter(t => t.status === 'pending')

    const lines = []
    lines.push('\u524d\u7aef\u4fee\u6539\u8be6\u60c5\uff1a')
    lines.push('\u9879\u76ee\uff1a' + projectName)
    lines.push('\u65f6\u95f4\uff1a' + timestamp)
    lines.push('')

    // Group by file
    const fileGroups = new Map()
    for (const tag of tags) {
      const filePath = tag.bindFilePath || activePath || ''
      const fileName = filePath ? filePath.split(/[\/\\]/).pop() : (openFiles[0]?.name || 'unknown')
      if (!fileGroups.has(fileName)) fileGroups.set(fileName, [])
      fileGroups.get(fileName).push(tag)
    }

    lines.push('\u4fee\u6539\u7684\u6587\u4ef6\u548c\u5143\u7d20\uff1a')
    let fileIndex = 1
    for (const [fileName, fileTags] of fileGroups) {
      lines.push(fileIndex + '. \u6587\u4ef6\uff1a' + fileName)
      for (const tag of fileTags) {
        let desc = '   - '
        if (tag.bindSelector) desc += tag.bindSelector + ': '
        desc += tag.label
        if (tag.detail) desc += ' (' + tag.detail + ')'
        lines.push(desc)
      }
      fileIndex++
    }
    lines.push('')

    const effects = tags.filter(t => t.source === 'effect')
    if (effects.length > 0) {
      lines.push('\u65b0\u589e\u6548\u679c\uff1a')
      for (const tag of effects) {
        lines.push('- ' + (tag.bindSelector || '') + ': ' + tag.label)
      }
      lines.push('')
    }

    lines.push('\u4fee\u6539\u7ebf\u8bb0\u5f55\uff1a')
    for (const tag of tags) {
      const s = (tag.status === 'applied' || tag.status === 'done') ? '\u5df2\u5e94\u7528' : '\u5f85\u5904\u7406'
      lines.push('- [' + s + '] ' + tag.label)
    }
    lines.push('')
    lines.push('\u5f53\u524d\u4ee3\u7801\u5df2\u4fdd\u5b58\u3002')
    lines.push('')
    lines.push('\u8bf7\u57fa\u4e8e\u4ee5\u4e0a\u4fee\u6539\u7ee7\u7eed\u5f00\u53d1\u3002')
    return lines.join('\n')
  }

  function copyModlineSummary() {
    const summary = generateModlineSummary()
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary)
    }
    return summary
  }

  function getSavedDialogOptions() {
    try {
      const raw = localStorage.getItem('livefront_settings')
      if (!raw) return []
      const settings = JSON.parse(raw)
      return Array.isArray(settings.dialogs) ? settings.dialogs : []
    } catch (e) { return [] }
  }

  async function getMcpServerOptions() {
    try {
      const servers = await LiveFront.Services.mcp.listConnectedServers();
      return Array.isArray(servers) ? servers : [];
    } catch {
      return [];
    }
  }

  function classifyMcpError(error) {
    const code = error?.code || '';
    const message = error?.message || '';
    if (code === 'SERVER_NOT_FOUND' || '未找到 MCP Server' in message) return '服务器不存在';
    if (code === 'SERVER_DISCONNECTED' || '未连接' in message) return '服务器未连接';
    if (code === 'TIMEOUT' || /timeout|timed out/i.test(message)) return '连接超时';
    if (code === 'TOOL_NOT_FOUND' || /not found|unknown tool/i.test(message)) return '工具不存在';
    if (code === 'INVALID_PARAMS' || /invalid|missing|required/i.test(message)) return '参数错误';
    if (/ECONNREFUSED|fetch failed|NetworkError/i.test(message)) return '网络不可达';
    return message || '未知错误';
  }

  async function sendSummaryToMcpServer(serverName) {
    const summary = generateModlineSummary();
    if (!summary) return;
    const doCall = async () => LiveFront.Services.mcp.callRemoteTool(serverName, 'livefront.apply-modification-summary', { summary });
    try {
      const result = await doCall();
      _showToast('✅ 已通过 MCP 发送到 ' + serverName);
      return result;
    } catch (error) {
      const friendly = classifyMcpError(error);
      _showToastWithAction('MCP 发送失败: ' + friendly, '重试', async () => {
        try {
          const result = await doCall();
          _showToast('✅ 重试成功：' + serverName);
          return result;
        } catch (retryError) {
          _showToast('重试失败: ' + classifyMcpError(retryError));
        }
      });
      throw error;
    }
  }

  async function sendSummaryToDialog(dialog) {
    const summary = generateModlineSummary()
    if (!dialog) return

    // --- LiveFront Bridge: try WebSocket auto-send for web AI platforms ---
    const webPlatforms = { "chatgpt": "chatgpt", "claude-web": "claude", "doubao-web": "doubao" }
    const bridgeTarget = webPlatforms[dialog.type]

    if (bridgeTarget && LiveFront.Services?.bridge) {
      try {
        const conn = await LiveFront.Services.bridge.isConnected()
        if (conn && conn.connected) {
          const result = await LiveFront.Services.bridge.sendToExtension(summary, bridgeTarget)
          if (result && result.success) {
            _showToast("✅ 已自动发送到 " + (dialog.name || dialog.type))
            LiveFront.EventBus.emit("modline:send-to-dialog", {
              dialogId: dialog.id, dialogName: dialog.name || dialog.type || "dialog",
              identifier: dialog.identifier || "", summary
            })
            return
          }
        }
      } catch (e) {
        console.log("[ModLine] Bridge not available, falling back:", e.message)
      }
      // Bridge not connected — fallback to clipboard + open URL
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summary)
      }
      if (dialog.identifier) {
        LiveFront.ipc.invoke("shell:open-external", dialog.identifier)
      }
      _showToastWithAction(
        "📋 摘要已复制（浏览器插件未连接），请手动粘贴",
        "打开页面",
        () => { if (dialog.identifier) LiveFront.ipc.invoke("shell:open-external", dialog.identifier) }
      )
      LiveFront.EventBus.emit("modline:send-to-dialog", {
        dialogId: dialog.id, dialogName: dialog.name || dialog.type || "dialog",
        identifier: dialog.identifier || "", summary
      })
      return
    }
    // --- End LiveFront Bridge ---

    if (dialog.type === 'codex' || dialog.type === 'claude-web') {
      const command = dialog.identifier || (dialog.type === 'codex' ? 'codex' : 'claude')
      try {
        const result = await LiveFront.ipc.invoke('ai:send-to-cli', { command, summary })
        if (result && result.success) {
          _showToast('Sent to ' + (dialog.name || dialog.type))
        } else {
          _showToast('CLI send failed: ' + (result ? result.error : 'unknown'))
        }
      } catch (err) {
        _showToast('CLI send failed: ' + err.message)
      }
    } else if (dialog.type === 'chatgpt' || dialog.type === 'doubao-web' || dialog.type === 'other') {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summary)
      }
      if (dialog.identifier) {
        LiveFront.ipc.invoke('shell:open-external', dialog.identifier)
      }
      _showToast('Summary copied, paste into ' + (dialog.name || dialog.type))
    } else if (dialog.type === 'mcp') {
      await sendSummaryToMcpServer(dialog.identifier);
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summary)
      }
      _showToast('Summary copied to clipboard')
    }

    LiveFront.EventBus.emit('modline:send-to-dialog', {
      dialogId: dialog.id,
      dialogName: dialog.name || dialog.type || 'dialog',
      identifier: dialog.identifier || '',
      summary
    })
  }


  function _showToastWithAction(msg, actionLabel, actionCallback) {
    let toast = document.getElementById('modlineToast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'modlineToast'
      toast.className = 'modline-toast'
      document.body.appendChild(toast)
    }
    toast.innerHTML = ''
    const textSpan = document.createElement('span')
    textSpan.textContent = msg
    toast.appendChild(textSpan)

    if (actionLabel && actionCallback) {
      const btn = document.createElement('button')
      btn.className = 'btn btn-primary'
      btn.style.cssText = 'margin-left:8px;font-size:11px;padding:2px 10px;'
      btn.textContent = actionLabel
      btn.addEventListener('click', () => {
        toast.classList.remove('visible')
        actionCallback()
      })
      toast.appendChild(btn)
    }

    toast.classList.add('visible')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(() => toast.classList.remove('visible'), actionCallback ? 10000 : 3000)
  }

  function _updateAIHint() {
    const hint = document.getElementById('modlineAIHint')
    if (!hint) return
    hint.style.display = _checkAIConfigured() ? 'none' : 'flex'
  }

  // ============ 修改 Store ============
  const ModStore = {
    _tags: [],
    _sendMode: 'batch', // 'batch' | 'sequential'
    _isProcessing: false,

    addTag(mod) {
      const tag = {
        id: 'tag_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        label: mod.label || '修改',
        detail: mod.detail || '',
        bindSelector: mod.bindSelector || null,
        bindFilePath: mod.bindFilePath || null,
        status: 'pending', // pending | processing | sent | applied | reverted
        order: this._tags.length,
        source: mod.source || 'user', // user | ai | effect
        createdAt: Date.now(),
        _snapshotVersion: null
      }
      this._tags.push(tag)
      this._render()
      return tag
    },

    removeTag(tagId) {
      const tag = this._tags.find(t => t.id === tagId)
      if (!tag) return
      // applied 标签需要确认
      if (tag.status === 'applied') {
        const ok = confirm('这个修改已应用，删除将回退。确定？')
        if (!ok) return
        if (tag._snapshotVersion) {
          SnapshotStack.restoreSnapshot(tag._snapshotVersion)
        }
      }
      this._tags = this._tags.filter(t => t.id !== tagId)
      this._reindex()
      this._render()
    },

    updateTag(tagId, updates) {
      const tag = this._tags.find(t => t.id === tagId)
      if (!tag) return
      Object.assign(tag, updates)
      this._render()
    },

    getPendingTags() {
      return this._tags.filter(t => t.status === 'pending')
    },

    getTags() {
      return this._tags
    },

    setSendMode(mode) {
      this._sendMode = mode
      this._render()
    },

    // 发送修改 —— 真正调用 AI
    async sendModifications() {
      if (this._isProcessing) return

      // 检查 AI 配置
      if (!_checkAIConfigured()) {
        _showAIConfigPrompt()
        return
      }

      const pending = this.getPendingTags()
      if (pending.length === 0) return

      this._isProcessing = true
      this._render()

      if (this._sendMode === 'batch') {
        // ── 全部发送模式 ──
        const snap = await SnapshotStack.saveSnapshot('batch-send')
        // 标记所有 pending 为 processing
        pending.forEach(tag => { tag.status = 'processing' })
        this._render()

        // 构建用户消息
        const userMsg = '请根据以下要求修改代码：\n' +
          pending.map((tag, i) =>
            `${i + 1}. ${tag.label}` +
            (tag.bindSelector ? ` (目标元素: ${tag.bindSelector})` : '') +
            (tag.detail ? `\n   详细说明: ${tag.detail}` : '')
          ).join('\n')

        // 构建 system message（包含所有标签状态）
        const allTags = this.getTags()
        const sysMsg = _buildModlineSystemMessage(allTags)

        try {
          const aiResponse = await _callAI(userMsg, sysMsg)

          // 解析代码块并应用
          const codeBlocks = _parseCodeBlocks(aiResponse)
          if (codeBlocks.length > 0) {
            await _applyCodeBlocks(codeBlocks)
          }

          // 所有标签变为 applied
          pending.forEach(tag => {
            tag.status = 'applied'
            tag._snapshotVersion = snap?.version
            LiveFront.EventBus.emit('modification:created', {
              label: 'AI: ' + tag.label,
              source: 'ai',
              bindSelector: tag.bindSelector
            })
          })
          this._render()
          _showToast('✅ 所有修改已应用（' + pending.length + ' 个）')
          LiveFront.EventBus.emit('modline:batch-applied', { count: pending.length })

        } catch (err) {
          // 回退所有 pending 标签
          pending.forEach(tag => { tag.status = 'pending' })
          this._render()
          _showToast('❌ AI 调用失败: ' + err.message)
        }

      } else {
        // ── 顺序发送模式 ──
        const first = pending[0]
        first.status = 'processing'
        this._render()

        // 构建单条消息
        let userMsg = '请根据以下要求修改代码：\n'
        userMsg += `1. ${first.label}`
        if (first.bindSelector) userMsg += ` (目标元素: ${first.bindSelector})`
        if (first.detail) userMsg += `\n   详细说明: ${first.detail}`

        const allTags = this.getTags()
        const sysMsg = _buildModlineSystemMessage(allTags)

        try {
          const snap = await SnapshotStack.saveSnapshot('step-' + first.id)
          const aiResponse = await _callAI(userMsg, sysMsg)

          // 解析代码块并应用
          const codeBlocks = _parseCodeBlocks(aiResponse)
          if (codeBlocks.length > 0) {
            await _applyCodeBlocks(codeBlocks)
          }

          first.status = 'applied'
          first._snapshotVersion = snap?.version
          this._render()

          LiveFront.EventBus.emit('modification:created', {
            label: 'AI: ' + first.label,
            source: 'ai',
            bindSelector: first.bindSelector
          })
          LiveFront.EventBus.emit('modline:step-applied', {
            tagId: first.id,
            remaining: this.getPendingTags().length
          })

          // 提示继续
          const remaining = this.getPendingTags().length
          if (remaining > 0) {
            _showToastWithAction(
              '✅ 第 ' + (first.order + 1) + ' 步已完成，还有 ' + remaining + ' 个待处理',
              '继续下一步',
              () => { ModStore.sendModifications() }
            )
          } else {
            _showToast('✅ 所有修改已完成！')
          }

        } catch (err) {
          // 回退
          first.status = 'pending'
          this._render()
          _showToast('❌ AI 调用失败: ' + err.message)
        }
      }

      this._isProcessing = false
      this._render()
    },

    // 拖拽排序
    reorderTag(fromIndex, toIndex) {
      if (fromIndex === toIndex) return
      const tag = this._tags.splice(fromIndex, 1)[0]
      this._tags.splice(toIndex, 0, tag)
      this._reindex()
      this._render()
    },

    clearAll() {
      this._tags = []
      this._render()
    },

    _reindex() {
      this._tags.forEach((t, i) => { t.order = i })
    },

    _render() {
      _renderModline()
      _updateAIHint()
    }
  }

  // ============ 工具函数 ============
  function _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function _showToast(msg) {
    let toast = document.getElementById('modlineToast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'modlineToast'
      toast.className = 'modline-toast'
      document.body.appendChild(toast)
    }
    toast.textContent = msg
    toast.classList.add('visible')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 3000)
  }

  // ============ 渲染函数 ============
  function _renderModline() {
    const track = document.getElementById('modlineTrack')
    if (!track) return
    track.innerHTML = ''

    const tags = ModStore.getTags()
    const countEl = document.getElementById('modlineCount')
    if (countEl) countEl.textContent = tags.length + ' 个修改'

    const sendBtn = document.getElementById('modlineSendBtn')
    if (sendBtn) {
      const pendingCount = ModStore.getPendingTags().length
      sendBtn.disabled = pendingCount === 0 || ModStore._isProcessing
      sendBtn.textContent = ModStore._isProcessing ? '处理中...' : '发送修改'
    }

    if (tags.length === 0) {
      track.innerHTML = '<div class="modline-empty">在预览区编辑元素或使用 AI 修改代码时，修改会自动出现在这里</div>'
      return
    }

    // 渲染标签
    tags.forEach((tag, index) => {
      const el = document.createElement('div')
      el.className = 'modtag'
      el.dataset.tagId = tag.id
      el.dataset.index = index
      el.draggable = true

      // 序号圆点
      const indexDot = document.createElement('div')
      indexDot.className = 'modtag-index ' + tag.status
      if (tag.status !== 'applied') indexDot.textContent = (index + 1)
      el.appendChild(indexDot)

      // 标签内容
      const body = document.createElement('div')
      body.className = 'modtag-body'
      body.innerHTML = `
        <div class="modtag-label">${_esc(tag.label)}</div>
        ${tag.bindSelector ? '<div class="modtag-selector">' + _esc(tag.bindSelector) + '</div>' : ''}
        ${tag.source === 'ai' ? '<span class="modtag-source-ai">AI</span>' : ''}
        <div class="modtag-status">${tag.status}</div>
      `
      el.appendChild(body)

      // 删除按钮
      const del = document.createElement('div')
      del.className = 'modtag-delete'
      del.textContent = '\u00d7'
      del.addEventListener('click', (e) => {
        e.stopPropagation()
        ModStore.removeTag(tag.id)
      })
      el.appendChild(del)

      // 点击弹出内联编辑浮窗
      el.addEventListener('click', (e) => {
        if (e.target.closest('.modtag-delete')) return
        _showInlineEdit(tag, el)
      })

      // hover 高亮预览元素
      el.addEventListener('mouseenter', () => {
        if (tag.bindSelector) {
          _highlightElement(tag.bindSelector, true)
        }
      })
      el.addEventListener('mouseleave', () => {
        if (tag.bindSelector) {
          _highlightElement(tag.bindSelector, false)
        }
      })

      // 拖拽
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index.toString())
        el.style.opacity = '0.5'
        el.classList.add('modtag-dragging')
      })
      el.addEventListener('dragend', () => {
        el.style.opacity = '1'
        el.classList.remove('modtag-dragging')
      })
      el.addEventListener('dragover', (e) => {
        e.preventDefault()
        el.classList.add('modtag-dragover')
      })
      el.addEventListener('dragleave', () => {
        el.classList.remove('modtag-dragover')
      })
      el.addEventListener('drop', (e) => {
        e.preventDefault()
        el.classList.remove('modtag-dragover')
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
        ModStore.reorderTag(fromIndex, index)
      })

      track.appendChild(el)
    })

    // 添加按钮
    const addBtn = document.createElement('div')
    addBtn.className = 'modtag-add'
    addBtn.textContent = '+ 添加修改'
    addBtn.addEventListener('click', _showAddDialog)
    track.appendChild(addBtn)
  }

  function _esc(str) {
    const d = document.createElement('div')
    d.textContent = str
    return d.innerHTML
  }

  function _highlightElement(selector, on) {
    const wv = LiveFront.Preview?.getWebview()
    if (!wv) return
    const safeSel = selector.replace(/'/g, "\\'")
    if (on) {
      wv.executeJavaScript(`
        (function() {
          var el = document.querySelector('${safeSel}')
          if (el) { el.style.outline = '2px solid rgba(74,108,247,0.8)'; el.style.outlineOffset = '2px' }
        })()
      `).catch(() => {})
    } else {
      wv.executeJavaScript(`
        (function() {
          var el = document.querySelector('${safeSel}')
          if (el) { el.style.outline = ''; el.style.outlineOffset = '' }
        })()
      `).catch(() => {})
    }
  }

  // ============ 内联编辑浮窗 ============
  let _activeInlineEdit = null

  function _showInlineEdit(tag, anchorEl) {
    // 关闭之前的浮窗
    _closeInlineEdit()

    const rect = anchorEl.getBoundingClientRect()
    const popup = document.createElement('div')
    popup.className = 'modline-inline-edit'
    popup.innerHTML = `
      <div class="modline-inline-edit-row">
        <label>标签</label>
        <input type="text" id="_ieLabel" value="${_esc(tag.label)}">
      </div>
      <div class="modline-inline-edit-row">
        <label>说明</label>
        <textarea id="_ieDetail">${_esc(tag.detail || '')}</textarea>
      </div>
      <div class="modline-inline-edit-actions">
        <button class="btn btn-ghost modline-ie-cancel">取消</button>
        <button class="btn btn-primary modline-ie-save">保存</button>
      </div>
    `
    // 定位
    popup.style.position = 'fixed'
    popup.style.left = rect.left + 'px'
    popup.style.top = (rect.top - 10) + 'px'
    popup.style.transform = 'translateY(-100%)'
    popup.style.zIndex = '1000'

    document.body.appendChild(popup)
    _activeInlineEdit = popup

    // 自动聚焦
    setTimeout(() => popup.querySelector('#_ieLabel')?.focus(), 50)

    // 保存
    popup.querySelector('.modline-ie-save').addEventListener('click', () => {
      ModStore.updateTag(tag.id, {
        label: popup.querySelector('#_ieLabel').value.trim() || tag.label,
        detail: popup.querySelector('#_ieDetail').value.trim()
      })
      _closeInlineEdit()
    })

    // 取消
    popup.querySelector('.modline-ie-cancel').addEventListener('click', _closeInlineEdit)

    // 点击外部关闭
    setTimeout(() => {
      document.addEventListener('click', _onOutsideClick)
    }, 0)
  }

  function _onOutsideClick(e) {
    if (_activeInlineEdit && !_activeInlineEdit.contains(e.target) && !e.target.closest('.modtag')) {
      _closeInlineEdit()
    }
  }

  function _closeInlineEdit() {
    if (_activeInlineEdit) {
      _activeInlineEdit.remove()
      _activeInlineEdit = null
      document.removeEventListener('click', _onOutsideClick)
    }
  }

  // ============ 添加修改弹窗 ============
  function _showAddDialog() {
    _closeInlineEdit()
    const selectedEl = LiveFront.state.selectedElement
    const overlay = document.createElement('div')
    overlay.className = 'modline-dialog-overlay'
    overlay.innerHTML = `
      <div class="modline-dialog">
        <h3>添加修改</h3>
        <label>绑定元素（可选）</label>
        <input type="text" id="_addSelector" value="${selectedEl ? _esc(selectedEl.selector) : ''}" placeholder="点击预览区中的元素进行绑定">
        <label>修改描述（必填）</label>
        <input type="text" id="_addLabel" placeholder="例如：将按钮颜色改为红色">
        <label>详细说明（可选）</label>
        <textarea id="_addDetail" placeholder="补充说明..."></textarea>
        <div class="modline-dialog-actions">
          <button class="btn btn-ghost" id="_addCancel">取消</button>
          <button class="btn btn-primary" id="_addConfirm">确认</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    overlay.querySelector('#_addCancel').addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
    overlay.querySelector('#_addConfirm').addEventListener('click', () => {
      const label = overlay.querySelector('#_addLabel').value.trim()
      if (!label) {
        overlay.querySelector('#_addLabel').style.borderColor = 'var(--danger)'
        overlay.querySelector('#_addLabel').focus()
        return
      }
      ModStore.addTag({
        label,
        detail: overlay.querySelector('#_addDetail').value.trim(),
        bindSelector: overlay.querySelector('#_addSelector').value.trim() || null,
        source: 'user'
      })
      overlay.remove()
    })
    // Enter 键确认
    overlay.querySelector('#_addLabel').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') overlay.querySelector('#_addConfirm').click()
    })
    setTimeout(() => overlay.querySelector('#_addLabel')?.focus(), 50)
  }

  // ============ 模块注册 ============
  LiveFront.modules.register({
    id: 'modline',
    name: 'ModLine',
    version: '0.3.0',
    description: '修改线管理 — 可视化修改追踪与 AI 发送',

    dependencies: [],
    optionalDependencies: ['editor', 'preview', 'ai'],

    ui: {},
    commands: [],
    shortcuts: [
      { key: 'Ctrl+M', command: 'modline.focus' }
    ],
    menus: [],
    contextMenus: [],

    events: {
      emits: [
        { name: 'modline:batch-applied', payload: '{ count }' },
        { name: 'modline:step-applied', payload: '{ tagId, remaining }' },
        { name: 'modline:send-to-ai', payload: '{ message, tags }' }
      ],
      listens: ['modification:created', 'project:opened']
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx

      // 监听 modification:created（来自属性面板修改 CSS）
      ctx.eventBus.on('modification:created', (mod) => {
        if (mod.source === 'ai') return // 避免 AI 触发的 modification 无限循环
        ModStore.addTag({
          label: mod.label || '修改',
          detail: mod.detail || '',
          bindSelector: mod.selector || mod.bindSelector || null,
          bindFilePath: mod.bindFilePath || null,
          source: mod.source || 'user'
        })
      })

      // 监听 element:selected 以更新 selectedElement 引用
      ctx.eventBus.on('element:selected', (data) => {
        LiveFront.state.selectedElement = data
      })
      ctx.eventBus.on('element:deselected', () => {
        LiveFront.state.selectedElement = null
      })

      // 打开项目时保存 v0 快照
      ctx.eventBus.on('project:opened', async () => {
        ModStore.clearAll()
        SnapshotStack.clear()
        setTimeout(() => SnapshotStack.saveSnapshot('v0'), 1000)
      })

      // 注册命令
      ctx.commands.register('modline.focus', () => {
        const el = document.getElementById('modlineContainer')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      })

      // 初始化面板
      this._initPanel()

      console.log('[ModLine] Module initialized')
    },

    _initPanel() {
      const check = setInterval(() => {
        const workspace = document.getElementById('workspace')
        if (workspace) {
          clearInterval(check)
          this._injectModlineUI()
        }
      }, 300)
    },

    _injectModlineUI() {
      const container = document.createElement('div')
      container.className = 'modline-container'
      container.id = 'modlineContainer'

      container.innerHTML = `
        <div class="modline-header">
          <div class="modline-header-left">
            <span class="modline-title">修改线</span>
            <span class="modline-count" id="modlineCount">0 个修改</span>
          </div>
          <div class="modline-header-right">
            <span class="modline-mode-label" id="modlineModeLabel" title="点击切换模式">全部发送</span>
            <button class="modline-send-btn" id="modlineSendBtn" disabled>发送修改</button>
            <button class="modline-copy-btn" id="modlineCopyBtn" title="复制摘要">📋 复制摘要</button>
            <div class="modline-sendback-wrap" id="modlineSendbackWrap">
              <button class="modline-sendback-btn" id="modlineSendbackBtn">📤 发回AI ▾</button>
              <div class="modline-sendback-menu" id="modlineSendbackMenu"></div>
            </div>
          </div>
        </div>
        <div class="modline-ai-hint"          </div>
        </div>
        <div class="modline-ai-hint" id="modlineAIHint" style="display:none;">
          <span>💡 配置 AI 后可使用发送修改功能</span>
          <button class="modline-ai-hint-btn" id="modlineAIHintBtn">前往配置</button>
        </div>
        <div class="modline-track" id="modlineTrack" style="position:relative;"></div>
      `

      const workspace = document.getElementById('workspace')
      if (workspace) {
        workspace.appendChild(container)
      }

      // 事件绑定
      const sendBtn = document.getElementById('modlineSendBtn')
      const copyBtn = document.getElementById('modlineCopyBtn')
      const sendbackBtn = document.getElementById('modlineSendbackBtn')
      const sendbackMenu = document.getElementById('modlineSendbackMenu')
      const modeLabel = document.getElementById('modlineModeLabel')
      const hintBtn = document.getElementById('modlineAIHintBtn')

      sendBtn?.addEventListener('click', () => ModStore.sendModifications())

      copyBtn?.addEventListener('click', () => {
        copyModlineSummary()
        _showToast('\u2705 \u4fee\u6539\u6458\u8981\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f')
      })

      function renderSendbackMenu() {
        if (!sendbackMenu) return
        const options = getSavedDialogOptions()
        const icons = { codex: '\U0001f4bb', chatgpt: '\U0001f916', 'claude-web': '\U0001f9e0', 'doubao-web': '\U0001f36b', mcp: '\U0001f4ac', other: '\U0001f4ac' }
        let html = options.map(function(d) {
          return '<div class="modline-sendback-item" data-id="' + d.id + '">' +
            '<span class="modline-sendback-icon">' + (icons[d.type] || icons.other) + '</span>' +
            '<span>' + (d.name || d.type || 'dialog') + '</span></div>'
        }).join('')
        html += '<div class="modline-sendback-item modline-sendback-config" data-id="__config__"><span>\u2699\ufe0f \u914d\u7f6e\u5176\u4ed6AI...</span></div>'
        sendbackMenu.innerHTML = html
      }

      sendbackBtn?.addEventListener('click', function(e) {
        e.stopPropagation()
        renderSendbackMenu()
        sendbackMenu.style.display = sendbackMenu.style.display === 'block' ? 'none' : 'block'
      })

      sendbackMenu?.addEventListener('click', async function(e) {
        var item = e.target.closest('.modline-sendback-item')
        if (!item) return
        sendbackMenu.style.display = 'none'
        var id = item.dataset.id
        if (id === '__config__') {
          LiveFront.Commands.execute('settings.open', { section: 'dialogs' })
          return
        }
        var options = getSavedDialogOptions()
        var dialog = options.find(function(d) { return d.id === id })
        if (dialog) await sendSummaryToDialog(dialog)
      })

      document.addEventListener('click', function(e) {
        if (!sendbackMenu) return
        var wrap = document.getElementById('modlineSendbackWrap')
        if (wrap && !wrap.contains(e.target)) sendbackMenu.style.display = 'none'
      })

      LiveFront.EventBus.on('settings:changed', function() {
        if (sendbackMenu && sendbackMenu.style.display === 'block') renderSendbackMenu()
      })

      modeLabel?.addEventListener('click', () => {
        if (ModStore._sendMode === 'batch') {
          ModStore.setSendMode('sequential')
          modeLabel.textContent = '顺序发送'
        } else {
          ModStore.setSendMode('batch')
          modeLabel.textContent = '全部发送'
        }
      })

      hintBtn?.addEventListener('click', () => {
        LiveFront.EventBus.emit('ui:switch-tab', { tab: 'ai' })
      })

      _renderModline()
      _updateAIHint()
    },

    destroy() {
      _closeInlineEdit()
      SnapshotStack.clear()
    }
  })

  // 暴露全局 API
  window.LiveFront.ModStore = ModStore
  window.LiveFront.SnapshotStack = SnapshotStack
  window.LiveFront.ModSummary = { generate: generateModlineSummary, copy: copyModlineSummary, sendToDialog: sendSummaryToDialog }
})()
