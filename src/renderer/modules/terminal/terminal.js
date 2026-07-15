/* LiveFront 终端管理器*/
(function () {
  const terminals = new Map()
  let activeTermId = null
  let termCounter = 0
  let containerEl = null
  let tabContainerEl = null
  let termContainerEl = null
  let resizeObserver = null
  let isInitialized = false

  // xterm 配色方案
  const TERM_THEME = {
    background: '#0c0c0e',
    foreground: '#eaeaed',
    cursor: '#4a6cf7',
    cursorAccent: '#0c0c0e',
    selectionBackground: '#4a6cf740',
    black: '#555560',
    red: '#f87171',
    green: '#34d399',
    yellow: '#fbbf24',
    blue: '#4a6cf7',
    magenta: '#a78bfa',
    cyan: '#22d3ee',
    white: '#eaeaed'
  }

  // ============ 创建 xterm 实例 ============
  async function createXTerm(container) {
    const { Terminal } = await import('xterm')
    const { FitAddon } = await import('@xterm/addon-fit')

    const term = new Terminal({
      theme: TERM_THEME,
      fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowTransparency: true,
      drawBoldTextInBrightColors: true
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    // 尝试加载 WebglAddon
    try {
      const { WebglAddon } = await import('@xterm/addon-webgl')
      const webglAddon = new WebglAddon()
      term.loadAddon(webglAddon)
    } catch (e) {
      console.warn('[Terminal] WebglAddon failed, using canvas:', e.message)
    }

    term.open(container)
    fitAddon.fit()

    return { term, fitAddon }
  }

  // ============ 创建终端进程 ============
  async function createTerminalProcess(cwd) {
    try {
      const result = await LiveFront.Services.terminal.create({ cwd })
      return result.termId
    } catch (e) {
      console.error('[Terminal] createTerminalProcess failed:', e)
      return null
    }
  }

  // ============ 渲染 UI ============
  function renderUI() {
    if (!containerEl) return

    containerEl.innerHTML = `
      <div class="terminal-tab-bar" id="terminalTabBar">
        <div class="terminal-tabs-list" id="terminalTabsList"></div>
        <button class="terminal-tab-add" id="terminalTabAdd" title="New Terminal">+</button>
      </div>
      <div class="terminal-content" id="terminalContent"></div>
    `

    tabContainerEl = containerEl.querySelector('#terminalTabsList')
    termContainerEl = containerEl.querySelector('#terminalContent')

    // + 按钮事件
    containerEl.querySelector('#terminalTabAdd').addEventListener('click', () => {
      createTerminal()
    })

    // ResizeObserver 监听容器大小变化
    resizeObserver = new ResizeObserver(() => {
      fitActiveTerminal()
    })
    resizeObserver.observe(termContainerEl)
  }

  // ============ 渲染标签栏============
  function renderTabs() {
    if (!tabContainerEl) return
    tabContainerEl.innerHTML = ''

    for (const [termId, termData] of terminals) {
      const tab = document.createElement('div')
      tab.className = 'terminal-tab' + (termId === activeTermId ? ' active' : '')
      tab.dataset.termId = termId

      const label = document.createElement('span')
      label.className = 'terminal-tab-label'
      label.textContent = 'Terminal ' + termData.index

      const closeBtn = document.createElement('span')
      closeBtn.className = 'terminal-tab-close'
      closeBtn.textContent = '\u00d7'
      closeBtn.title = 'Close Terminal'

      tab.appendChild(label)
      tab.appendChild(closeBtn)

      tab.addEventListener('click', (e) => {
        if (e.target === closeBtn || e.target.classList.contains('terminal-tab-close')) {
          return
        }
        switchTerminal(termId)
      })

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        closeTerminal(termId)
      })

      tabContainerEl.appendChild(tab)
    }
  }

  // ============ 创建新终端============
  async function createTerminal(cwd) {
    termCounter++
    const index = termCounter

    // 创建 xterm 实例
    const termDiv = document.createElement('div')
    termDiv.className = 'terminal-instance'
    termDiv.style.display = 'none'
    termContainerEl.appendChild(termDiv)

    const { term, fitAddon } = await createXTerm(termDiv)

    // 创建终端进程
    const termId = await createTerminalProcess(cwd || LiveFront.state.currentProjectPath)

    if (!termId) {
      term.dispose()
      termDiv.remove()
      termCounter--
      return null
    }

    const termData = {
      termId,
      term,
      fitAddon,
      index,
      container: termDiv
    }

    terminals.set(termId, termData)

    // xterm 数据 → 写入终端进程
    term.onData((data) => {
      LiveFront.Services.terminal.write(termId, data)
    })

    // 终端进程数据
    const onDataCleanup = LiveFront.Services.terminal.onData(({ termId: tid, data }) => {
      if (tid === termId) term.write(data)
    })

    // 终端进程退出
    const onExitCleanup = LiveFront.Services.terminal.onExit(({ termId: tid, exitCode }) => {
      if (tid === termId) {
        term.write('\r\n[Process exited with code ' + exitCode + ']\r\n')
      }
    })

    termData._cleanups = [onDataCleanup, onExitCleanup]

    // 切换到此终端
    switchTerminal(termId)

    // 初始 fit
    setTimeout(() => {
      fitActiveTerminal()
    }, 100)

    // 刷新标签
    renderTabs()

    LiveFront.EventBus.emit('terminal:created', { termId })
    return termId
  }

  // ============ 切换终端 ============
  function switchTerminal(termId) {
    if (termId === activeTermId) return

    // 隐藏其他所有终端?
    for (const [tid, td] of terminals) {
      td.container.style.display = tid === termId ? 'block' : 'none'
    }

    // 显示目标终端
    activeTermId = termId
    const termData = terminals.get(termId)
    if (termData) {
      termData.term.focus()
    }

    // 刷新标签栏
    renderTabs()

    // fit 聚焦
    fitActiveTerminal()
  }

  // ============ 关闭终端 ============
  async function closeTerminal(termId) {
    const termData = terminals.get(termId)
    if (!termData) return

    // 保留至少一个终端
    if (terminals.size <= 1) {
      return
    }

    // 清理事件
    if (termData._cleanups) {
      termData._cleanups.forEach(fn => fn && fn())
    }

    // kill 终端进程
    await LiveFront.Services.terminal.kill(termId)

    // dispose xterm
    termData.term.dispose()
    termData.container.remove()

    // 移除记录
    terminals.delete(termId)

    // 如果关闭的是当前活跃终端，切换到下一个
    if (activeTermId === termId) {
      const firstId = terminals.keys().next().value
      if (firstId) {
        switchTerminal(firstId)
      } else {
        activeTermId = null
      }
    }

    // 刷新标签栏
    renderTabs()

    // 触发事件
    LiveFront.EventBus.emit('terminal:closed', { termId })
  }

  // ============ fit 终端 ============
  function fitActiveTerminal() {
    if (!activeTermId) return
    const termData = terminals.get(activeTermId)
    if (!termData) return

    try {
      termData.fitAddon.fit()
      const cols = termData.term.cols
      const rows = termData.term.rows
      LiveFront.Services.terminal.resize(termData.termId, cols, rows)
    } catch (e) {
      // ignore fit errors during initialization
    }
  }

  // ============ TerminalManager API ============
  window.LiveFront.TerminalManager = {
    render(container) {
      containerEl = container
      renderUI()

      // 如果项目已打开，自动创建终端?
      if (LiveFront.state.currentProjectPath && terminals.size === 0) {
        setTimeout(() => {
          createTerminal(LiveFront.state.currentProjectPath)
        }, 100)
      }

      isInitialized = true
    },

    togglePanel() {
      const panel = document.getElementById('panel')
      if (!panel) return
      if (panel.style.display === 'none') {
        panel.style.display = ''
        LiveFront.PanelManager.activateTab('terminal')
        setTimeout(() => fitActiveTerminal(), 100)
      } else {
        const activeTab = LiveFront.PanelManager.getActiveTab()
        if (activeTab && activeTab.id === 'terminal') {
          panel.style.display = 'none'
        } else {
          LiveFront.PanelManager.activateTab('terminal')
          setTimeout(() => fitActiveTerminal(), 100)
        }
      }
    },

    async createTerminal(cwd) {
      return createTerminal(cwd)
    },

    clearActiveTerminal() {
      if (!activeTermId) return
      const termData = terminals.get(activeTermId)
      if (termData) {
        termData.term.clear()
      }
    },

    closeActiveTerminal() {
      if (activeTermId) {
        closeTerminal(activeTermId)
      }
    },

    onProjectOpened(projectPath) {
      // 如果终端已存在，则不支持 cwd 切换，需重启
      if (terminals.size > 0) {
        // 关闭所有终端并重新创建
        for (const [termId] of terminals) {
          closeTerminal(termId)
        }
      }
      termCounter = 0
      createTerminal(projectPath)
    },

    onActivate() {
      setTimeout(() => fitActiveTerminal(), 50)
      if (activeTermId) {
        const termData = terminals.get(activeTermId)
        if (termData) termData.term.focus()
      }
    },

    onDeactivate() {
      // 失去焦点时的特殊处理
    },

    destroyAll() {
      for (const [termId, termData] of terminals) {
        if (termData._cleanups) {
          termData._cleanups.forEach(fn => fn && fn())
        }
        termData.term.dispose()
        LiveFront.Services.terminal.kill(termId)
      }
      terminals.clear()
      activeTermId = null
      termCounter = 0
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      isInitialized = false
    }
  }
})()