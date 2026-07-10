/* LiveFront Editor — Monaco 编辑器核心管理器 */
import * as monaco from 'monaco-editor'

// 文件扩展名 → Monaco 语言映射
const LANG_MAP = {
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', less: 'less',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescriptreact', jsx: 'javascriptreact',
  json: 'json',
  md: 'markdown',
  svg: 'xml',
  xml: 'xml',
  yml: 'yaml', yaml: 'yaml',
  toml: 'toml',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp',
  sh: 'shell', bash: 'shell', zsh: 'shell',
  ps1: 'powershell',
  sql: 'sql',
  graphql: 'graphql',
  vue: 'html',
  svelte: 'html'
}

// 语言 → 显示名称
const LANG_DISPLAY = {
  html: 'HTML', css: 'CSS', scss: 'SCSS', less: 'LESS',
  javascript: 'JavaScript', typescript: 'TypeScript',
  javascriptreact: 'JSX', typescriptreact: 'TSX',
  json: 'JSON', markdown: 'Markdown', xml: 'XML', svg: 'SVG',
  yaml: 'YAML', toml: 'TOML', python: 'Python', ruby: 'Ruby',
  go: 'Go', rust: 'Rust', java: 'Java', c: 'C', cpp: 'C++',
  shell: 'Shell', powershell: 'PowerShell', sql: 'SQL',
  graphql: 'GraphQL', plaintext: 'Plain Text'
}

function getLanguage(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  return LANG_MAP[ext] || 'plaintext'
}

function getLanguageDisplay(lang) {
  return LANG_DISPLAY[lang] || lang
}

class EditorManager {
  constructor() {
    this._editor = null          // Monaco 实例
    this._container = null       // DOM 容器
    this._models = new Map()     // path → { model, viewState, dirty }
    this._activePath = null      // 当前激活文件路径
    this._fontSize = 14
    this._resizeObserver = null
    this._debounceTimer = null
    this._autoSave = true
    this._autoSaveDelay = 300
    this._ready = false
  }

  // ── 初始化 Monaco 编辑器 ──
  init(containerEl) {
    if (this._ready) return
    this._container = containerEl

    // 定义暗色主题
    monaco.editor.defineTheme('livefront-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '555560', fontStyle: 'italic' },
        { token: 'keyword', foreground: '4a6cf7' },
        { token: 'string', foreground: '22c55e' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'type', foreground: '4a6cf7' },
        { token: 'delimiter', foreground: 'a1a1aa' },
        { token: 'tag', foreground: '4a6cf7' },
        { token: 'attribute.name', foreground: 'f59e0b' },
        { token: 'attribute.value', foreground: '22c55e' },
      ],
      colors: {
        'editor.background': '#0c0c0e',
        'editor.foreground': '#e4e4e7',
        'editor.lineHighlightBackground': '#ffffff0a',
        'editor.selectionBackground': '#4a6cf720',
        'editor.inactiveSelectionBackground': '#4a6cf710',
        'editorCursor.foreground': '#4a6cf7',
        'editorLineNumber.foreground': '#555560',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editorIndentGuide.background': '#ffffff0a',
        'editorIndentGuide.activeBackground': '#ffffff18',
        'editor.findMatchBackground': '#4a6cf740',
        'editor.findMatchHighlightBackground': '#4a6cf720',
        'editorBracketMatch.background': '#4a6cf720',
        'editorBracketMatch.border': '#4a6cf760',
        'editorWidget.background': '#1a1a24',
        'editorWidget.border': '#ffffff14',
        'editorSuggestWidget.background': '#1a1a24',
        'editorSuggestWidget.border': '#ffffff14',
        'editorSuggestWidget.selectedBackground': '#ffffff14',
        'editorHoverWidget.background': '#1a1a24',
        'editorHoverWidget.border': '#ffffff14',
        'minimap.background': '#0c0c0e',
        'scrollbarSlider.background': '#ffffff18',
        'scrollbarSlider.hoverBackground': '#ffffff28',
        'scrollbarSlider.activeBackground': '#ffffff38',
      }
    })

    // 创建编辑器
    this._editor = monaco.editor.create(this._container, {
      theme: 'livefront-dark',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: this._fontSize,
      lineHeight: Math.round(this._fontSize * 1.6),
      tabSize: 2,
      wordWrap: 'off',
      minimap: { enabled: true },
      bracketPairColorization: { enabled: true },
      matchBrackets: 'always',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'advanced',
      indentGuides: { enabled: true },
      renderLineHighlight: 'line',
      renderLineHighlightOnlyWhenFocus: false,
      folding: true,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      suggest: {
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showSnippets: true,
      },
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
        useShadows: false,
      },
      automaticLayout: false, // 我们手动控制 layout
      contextmenu: false, // 使用自定义右键菜单
      padding: { top: 8, bottom: 8 },
    })

    // 自适应大小变化
    this._resizeObserver = new ResizeObserver(() => this.layout())
    this._resizeObserver.observe(this._container)

    // 编辑器事件
    this._editor.onDidChangeModelContent(() => {
      if (!this._activePath) return
      const entry = this._models.get(this._activePath)
      if (!entry) return
      entry.dirty = true
      // 通知 EventBus
      const content = entry.model.getValue()
      if (window.LiveFront) {
        LiveFront.EventBus.emit('editor:content-change', {
          path: this._activePath,
          content
        })
      }
      // 防抖自动保存
      if (this._autoSave) {
        this._scheduleAutoSave()
      }
    })

    this._editor.onDidChangeCursorPosition((e) => {
      if (window.LiveFront) {
        LiveFront.EventBus.emit('editor:cursor-move', {
          line: e.position.lineNumber,
          column: e.position.column,
          path: this._activePath
        })
      }
    })

    this._ready = true
    console.log('[Editor] Monaco initialized')
  }

  // ── 打开文件 ──
  async openFile(path, content, language) {
    if (!this._ready) return null

    // 如果已经有该文件的 model
    if (this._models.has(path)) {
      this._switchToFile(path)
      return this._models.get(path)
    }

    // 推断语言
    const filename = path.split(/[/\\]/).pop()
    const lang = language || getLanguage(filename)

    // 创建新 model
    const uri = monaco.Uri.file(path)
    const model = monaco.editor.createModel(content, lang, uri)

    const entry = {
      model,
      viewState: null,
      dirty: false,
      path,
      name: filename,
      language: lang,
      languageDisplay: getLanguageDisplay(lang)
    }
    this._models.set(path, entry)

    this._switchToFile(path)
    return entry
  }

  // ── 关闭文件 ──
  closeFile(path) {
    const entry = this._models.get(path)
    if (!entry) return

    // 保存 viewState
    if (this._activePath === path) {
      entry.viewState = this._editor.saveViewState()
    }

    // 销毁 model
    entry.model.dispose()
    this._models.delete(path)

    // 如果关闭的是当前文件
    if (this._activePath === path) {
      this._activePath = null
      // 切换到相邻文件
      const paths = Array.from(this._models.keys())
      if (paths.length > 0) {
        this._switchToFile(paths[paths.length - 1])
      } else {
        // 没有打开的文件了
        this._editor.setModel(null)
      }
    }

    if (window.LiveFront) {
      LiveFront.EventBus.emit('editor:file-closed', { path })
    }
  }

  // ── 保存当前文件 ──
  async saveFile(path) {
    const targetPath = path || this._activePath
    if (!targetPath) return false
    const entry = this._models.get(targetPath)
    if (!entry) return false

    const content = entry.model.getValue()
    try {
      await LiveFront.Services.fileSystem.writeFile(targetPath, content)
      entry.dirty = false
      LiveFront.EventBus.emit('file:saved', { path: targetPath })
      return true
    } catch (e) {
      console.error('[Editor] Save failed:', e)
      LiveFront.EventBus.emit('file:save-error', { path: targetPath, error: e.message })
      return false
    }
  }

  // ── 另存为 ──
  async saveAs() {
    if (!this._activePath) return false
    const entry = this._models.get(this._activePath)
    if (!entry) return false

    const newPath = await LiveFront.Services.dialog.saveFile()
    if (!newPath) return false

    const content = entry.model.getValue()
    try {
      await LiveFront.Services.fileSystem.writeFile(newPath, content)
      // 更新 model
      const oldPath = this._activePath
      entry.dirty = false
      entry.path = newPath
      entry.name = newPath.split(/[/\\]/).pop()
      entry.language = getLanguage(entry.name)
      entry.languageDisplay = getLanguageDisplay(entry.language)
      monaco.editor.setModelLanguage(entry.model, entry.language)
      this._models.delete(oldPath)
      this._models.set(newPath, entry)
      this._activePath = newPath
      LiveFront.EventBus.emit('file:saved', { path: newPath })
      return true
    } catch (e) {
      console.error('[Editor] SaveAs failed:', e)
      return false
    }
  }

  // ── 新建文件 ──
  async newFile(projectPath) {
    if (!projectPath) {
      projectPath = LiveFront.state.currentProjectPath
    }
    if (!projectPath) return null

    // 生成 untitled-N 路径
    let n = 1
    let filePath
    do {
      filePath = projectPath + (projectPath.includes('\\') ? '\\' : '/') + `untitled-${n}.html`
      n++
    } while (this._models.has(filePath) || await LiveFront.Services.fileSystem.exists(filePath))

    // 创建空文件
    const content = ''
    await LiveFront.Services.fileSystem.writeFile(filePath, content)
    return this.openFile(filePath, content, 'html')
  }

  // ── 获取当前编辑器实例 ──
  getActiveEditor() {
    return this._editor
  }

  // ── 获取当前激活文件路径 ──
  getActivePath() {
    return this._activePath
  }

  // ── 获取当前 model ──
  getActiveModel() {
    if (!this._activePath) return null
    const entry = this._models.get(this._activePath)
    return entry ? entry.model : null
  }

  // ── 获取文件 entry ──
  getEntry(path) {
    return this._models.get(path) || null
  }

  // ── 获取所有打开的文件 ──
  getOpenFiles() {
    return Array.from(this._models.values())
  }

  // ── 检查文件是否有未保存修改 ──
  isDirty(path) {
    const entry = this._models.get(path || this._activePath)
    return entry ? entry.dirty : false
  }

  // ── 标记文件为已保存 ──
  markSaved(path) {
    const entry = this._models.get(path || this._activePath)
    if (entry) entry.dirty = false
  }

  // ── 设置字体大小 ──
  setFontSize(size) {
    this._fontSize = Math.max(10, Math.min(32, size))
    if (this._editor) {
      this._editor.updateOptions({
        fontSize: this._fontSize,
        lineHeight: Math.round(this._fontSize * 1.6)
      })
    }
  }

  // ── 切换 minimap ──
  toggleMinimap() {
    if (!this._editor) return
    const current = this._editor.getOption(monaco.editor.EditorOption.minimap)
    this._editor.updateOptions({ minimap: { enabled: !current.enabled } })
  }

  // ── 切换自动换行 ──
  toggleWordWrap() {
    if (!this._editor) return
    const current = this._editor.getOption(monaco.editor.EditorOption.wordWrap)
    this._editor.updateOptions({ wordWrap: current === 'on' ? 'off' : 'on' })
  }

  // ── 手动触发 layout ──
  layout() {
    if (this._editor) {
      this._editor.layout()
    }
  }

  // ── 销毁 ──
  dispose() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    for (const [, entry] of this._models) {
      entry.model.dispose()
    }
    this._models.clear()
    if (this._editor) {
      this._editor.dispose()
      this._editor = null
    }
    this._ready = false
  }

  // ── 内部方法 ──

  _switchToFile(path) {
    if (!this._editor) return

    // 保存当前文件的 viewState
    if (this._activePath && this._models.has(this._activePath)) {
      const current = this._models.get(this._activePath)
      current.viewState = this._editor.saveViewState()
    }

    const entry = this._models.get(path)
    if (!entry) return

    this._activePath = path
    this._editor.setModel(entry.model)

    // 恢复 viewState
    if (entry.viewState) {
      this._editor.restoreViewState(entry.viewState)
    }

    // 聚焦编辑器
    this._editor.focus()

    // 通知
    if (window.LiveFront) {
      LiveFront.EventBus.emit('editor:file-switched', {
        path,
        name: entry.name,
        language: entry.language,
        languageDisplay: entry.languageDisplay,
        dirty: entry.dirty
      })
    }
  }

  _scheduleAutoSave() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    this._debounceTimer = setTimeout(() => {
      if (this._activePath && this.isDirty(this._activePath)) {
        this.saveFile(this._activePath)
      }
    }, this._autoSaveDelay)
  }
}

// 暴露到全局
window.LiveFront = window.LiveFront || {}
window.LiveFront.Editor = new EditorManager()