/* LiveFront Editor — Monaco optional loader */
window.LiveFront = window.LiveFront || {}

const LANG_MAP = {
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', less: 'less',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescriptreact', jsx: 'javascriptreact',
  json: 'json', md: 'markdown', svg: 'xml', xml: 'xml',
  yml: 'yaml', yaml: 'yaml', toml: 'toml',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp',
  sh: 'shell', bash: 'shell', zsh: 'shell', ps1: 'powershell',
  sql: 'sql', graphql: 'graphql', vue: 'html', svelte: 'html'
}

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

async function loadMonaco() {
  try {
    return await import('monaco-editor/esm/vs/editor/editor.api')
  } catch (e) {
    console.warn('[Editor] Monaco unavailable, using textarea fallback', e)
    return null
  }
}

function createFallbackEditor(container) {
  const textarea = document.createElement('textarea')
  textarea.style.cssText = 'width:100%;height:100%;background:var(--bg-primary,#0c0c0e);color:var(--text-primary,#e4e4e7);border:0;padding:12px;font-family:var(--font-mono,"JetBrains Mono",monospace);font-size:14px;resize:none;'
  container.appendChild(textarea)
  return {
    _fallback: true,
    _textarea: textarea,
    _value: '',
    setModel(entry) {
      this._value = entry?.model?.getValue?.() || ''
      this._textarea.value = this._value
    },
    saveViewState: () => null,
    restoreViewState: () => {},
    focus: () => this._textarea.focus(),
    getOption: () => 'off',
    updateOptions: () => {},
    layout: () => {},
    dispose: () => {}
  }
}

class EditorManager {
  constructor() {
    this._editor = null
    this._monaco = null
    this._container = null
    this._models = new Map()
    this._activePath = null
    this._fontSize = 14
    this._resizeObserver = null
    this._debounceTimer = null
    this._autoSave = true
    this._autoSaveDelay = 300
    this._ready = false
  }

  async init(containerEl) {
    if (this._ready) return
    this._container = containerEl
    this._monaco = await loadMonaco()

    if (this._monaco) {
      this._monaco.editor.defineTheme('livefront-dark', {
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
          { token: 'attribute.value', foreground: '22c55e' }
        ],
        colors: {
          'editor.background': '#0c0c0e',
          'editor.foreground': '#e4e4e7',
          'editor.lineHighlightBackground': '#ffffff0a',
          'editorCursor.foreground': '#4a6cf7',
          'editorLineNumber.foreground': '#555560',
          'editorLineNumber.activeForeground': '#a1a1aa',
          'editorWidget.background': '#1a1a24',
          'editorWidget.border': '#ffffff14'
        }
      })

      this._editor = this._monaco.editor.create(this._container, {
        theme: 'livefront-dark',
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
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        suggest: { showMethods: true, showFunctions: true, showVariables: true }
      })

      this._resizeObserver = new ResizeObserver(() => this.layout())
      this._resizeObserver.observe(this._container)
    } else {
      this._editor = createFallbackEditor(this._container)
    }

    this._ready = true
  }

  async openFile(filePath, content, language) {
    if (!this._ready) return
    const lang = language || getLanguage(filePath)
    const name = filePath.split(/[/\\]/).pop()

    if (!this._models.has(filePath)) {
      if (this._monaco) {
        const model = this._monaco.editor.createModel(content || '', lang, this._monaco.Uri.file(filePath))
        this._models.set(filePath, { path: filePath, name, language: lang, languageDisplay: getLanguageDisplay(lang), model, viewState: null, dirty: false })
      } else {
        this._models.set(filePath, { path: filePath, name, language: lang, languageDisplay: getLanguageDisplay(lang), model: { getValue: () => content || '', setValue: (v) => { content = v }, dispose: () => {} }, viewState: null, dirty: false })
      }
    }

    this._switchToFile(filePath)
    if (window.LiveFront) LiveFront.EventBus.emit('editor:file-opened', { path: filePath, name, language: lang })
  }

  getActiveEditor() { return this._editor }
  getActivePath() { return this._activePath }
  getActiveModel() {
    if (!this._activePath) return null
    const entry = this._models.get(this._activePath)
    return entry ? entry.model : null
  }
  getEntry(path) { return this._models.get(path) || null }
  getOpenFiles() { return Array.from(this._models.values()) }
  isDirty(path) {
    const entry = this._models.get(path || this._activePath)
    return entry ? entry.dirty : false
  }
  markSaved(path) {
    const entry = this._models.get(path || this._activePath)
    if (entry) entry.dirty = false
  }
  layout() {
    if (this._editor?.layout) this._editor.layout()
  }
  dispose() {
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null }
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
    for (const [, entry] of this._models) entry.model.dispose?.()
    this._models.clear()
    this._editor?.dispose?.()
    this._editor = null
    this._ready = false
  }
  _switchToFile(path) {
    if (!this._editor) return
    if (this._activePath && this._models.has(this._activePath)) this._models.get(this._activePath).viewState = this._editor.saveViewState()
    const entry = this._models.get(path)
    if (!entry) return
    this._activePath = path
    this._editor.setModel(entry.model)
    if (entry.viewState) this._editor.restoreViewState(entry.viewState)
    this._editor.focus()
    if (window.LiveFront) LiveFront.EventBus.emit('editor:file-switched', { path, name: entry.name, language: entry.language, languageDisplay: entry.languageDisplay, dirty: entry.dirty })
  }
}

window.LiveFront.Editor = new EditorManager()
