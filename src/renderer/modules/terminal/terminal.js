/* LiveFront 缁堢绠＄悊鍣?*/
(function () {
  const terminals = new Map()
  let activeTermId = null
  let termCounter = 0
  let containerEl = null
  let tabContainerEl = null
  let termContainerEl = null
  let resizeObserver = null
  let isInitialized = false

  // xterm 閰嶈壊鏂规
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

  // ============ 鍒涘缓 xterm 瀹炰緥 ============
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

    // 灏濊瘯鍔犺浇 WebglAddon
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

  // ============ 鍒涘缓缁堢杩涚▼ ============
  async function createTerminalProcess(cwd) {
    try {
      const result = await LiveFront.Services.terminal.create({ cwd })
      return result.termId
    } catch (e) {
      console.error('[Terminal] createTerminalProcess failed:', e)
      return null
    }
  }

  // ============ 娓叉煋 UI ============
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

    // + 鎸夐挳浜嬩欢
    containerEl.querySelector('#terminalTabAdd').addEventListener('click', () => {
      createTerminal()
    })

    // ResizeObserver 鐩戝惉瀹瑰櫒澶у皬鍙樺寲
    resizeObserver = new ResizeObserver(() => {
      fitActiveTerminal()
    })
    resizeObserver.observe(termContainerEl)
  }

  // ============ 娓叉煋鏍囩鏍?============
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

  // ============ 鍒涘缓鏂扮粓绔?============
  async function createTerminal(cwd) {
    termCounter++
    const index = termCounter

    // 鍒涘缓 xterm 瀹炰緥
    const termDiv = document.createElement('div')
    termDiv.className = 'terminal-instance'
    termDiv.style.display = 'none'
    termContainerEl.appendChild(termDiv)

    const { term, fitAddon } = await createXTerm(termDiv)

    // 鍒涘缓缁堢杩涚▼
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

    // xterm 鏁版嵁 鈫?鍐欏叆缁堢杩涚▼
    term.onData((data) => {
      LiveFront.Services.terminal.write(termId, data)
    })

    // 缁堢杩涚▼鏁版嵁
    const onDataCleanup = LiveFront.Services.terminal.onData(({ termId: tid, data }) => {
      if (tid === termId) term.write(data)
    })

    // 缁堢杩涚▼閫€鍑?
    const onExitCleanup = LiveFront.Services.terminal.onExit(({ termId: tid, exitCode }) => {
      if (tid === termId) {
        term.write('\r\n[Process exited with code ' + exitCode + ']\r\n')
      }
    })

    termData._cleanups = [onDataCleanup, onExitCleanup]

    // 鍒囨崲鍒版缁堢
    switchTerminal(termId)

    // 鍒濆 fit
    setTimeout(() => {
      fitActiveTerminal()
    }, 100)

    // 鍒锋柊鏍囩
    renderTabs()

    LiveFront.EventBus.emit('terminal:created', { termId })
    return termId
  }

  // ============ 鍒囨崲缁堢 ============
  function switchTerminal(termId) {
    if (termId === activeTermId) return

    // 隐藏其他所有终端?
    for (const [tid, td] of terminals) {
      td.container.style.display = tid === termId ? 'block' : 'none'
    }

    // 鏄剧ず鐩爣缁堢
    activeTermId = termId
    const termData = terminals.get(termId)
    if (termData) {
      termData.term.focus()
    }

    // 鍒锋柊鏍囩鏍?
    renderTabs()

    // fit 鑱氱劍
    fitActiveTerminal()
  }

  // ============ 鍏抽棴缁堢 ============
  async function closeTerminal(termId) {
    const termData = terminals.get(termId)
    if (!termData) return

    // 淇濈暀鑷冲皯涓€涓粓绔?
    if (terminals.size <= 1) {
      return
    }

    // 娓呯悊浜嬩欢
    if (termData._cleanups) {
      termData._cleanups.forEach(fn => fn && fn())
    }

    // kill 缁堢杩涚▼
    await LiveFront.Services.terminal.kill(termId)

    // dispose xterm
    termData.term.dispose()
    termData.container.remove()

    // 绉婚櫎璁板綍
    terminals.delete(termId)

    // 濡傛灉鍏抽棴鐨勬槸褰撳墠娲昏穬缁堢锛屽垏鎹㈠埌涓嬩竴涓?
    if (activeTermId === termId) {
      const firstId = terminals.keys().next().value
      if (firstId) {
        switchTerminal(firstId)
      } else {
        activeTermId = null
      }
    }

    // 鍒锋柊鏍囩鏍?
    renderTabs()

    // 瑙﹀彂浜嬩欢
    LiveFront.EventBus.emit('terminal:closed', { termId })
  }

  // ============ fit 缁堢 ============
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
      // 濡傛灉缁堢宸插瓨鍦紝鍒欎笉鏀寔 cwd 鍒囨崲锛岄渶閲嶅惎
      if (terminals.size > 0) {
        // 鍏抽棴鎵€鏈夌粓绔苟閲嶆柊鍒涘缓
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