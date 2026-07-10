/* LiveFront React Compiler — browser-side JSX/TSX compilation with Sucrase */
window.LiveFront = window.LiveFront || {}

class ReactCompiler {
  constructor() {
    this._sucrase = null
    this._loading = null
  }

  async _ensureSucrase() {
    if (this._sucrase) return this._sucrase
    if (!this._loading) {
      this._loading = (async () => {
        try {
          const mod = await import('sucrase')
          this._sucrase = mod
          return mod
        } catch (e) {
          console.error('[ReactCompiler] Failed to load Sucrase:', e)
          this._sucrase = null
          return null
        }
      })()
    }

    return this._loading
  }

  async isAvailable() {
    const mod = await this._ensureSucrase()
    return Boolean(mod?.transform)
  }

  async compile(code, filename) {
    const mod = await this._ensureSucrase()
    if (!mod?.transform) {
      return { code: '', error: 'Sucrase is not available' }
    }

    try {
      const transforms = []
      const ext = (filename || '').split('.').pop().toLowerCase()
      if (ext === 'tsx' || ext === 'ts') transforms.push('typescript')
      if (ext === 'tsx' || ext === 'jsx') transforms.push('jsx')

      if (transforms.length === 0) {
        transforms.push('jsx')
      }

      const result = mod.transform(code, {
        transforms,
        jsxRuntime: 'classic',
        production: true
      })

      return { code: result.code || '', sourceMap: result.sourceMap || null }
    } catch (e) {
      console.warn('[ReactCompiler] Compile failed:', filename, e)
      return { code: '', error: e?.message || String(e) }
    }
  }

  transformImportsToGlobals(code) {
    let result = code

    result = result.replace(
      /import\s+\{([^}]+)\}\s+from\s+['\"](?:react-dom\/client|react-dom|react)['\"]\s*;?/g,
      (_, names) => {
        const trimmed = names
          .split(',')
          .map(n => n.trim())
          .filter(Boolean)
          .join(', ')
        return `const { ${trimmed} } = window.ReactDOM;`
      }
    )

    result = result.replace(
      /import\s+(\w+)\s+from\s+['\"](?:react-dom\/client|react-dom|react)['\"]\s*;?/g,
      (_, name) => `const ${name} = window.React;`
    )

    result = result.replace(
      /import\s+\{([^}]+)\}\s+from\s+['\"]react['\"]\s*;?/g,
      (_, names) => {
        const trimmed = names
          .split(',')
          .map(n => n.trim())
          .filter(Boolean)
          .join(', ')
        return `const { ${trimmed} } = window.React;`
      }
    )

    result = result.replace(
      /import\s+(\w+)\s+from\s+['\"]react['\"]\s*;?/g,
      (_, name) => `const ${name} = window.React;`
    )

    result = result.replace(
      /import\s+(\w+)\s+from\s+['\"]react-dom\/client['\"]\s*;?/g,
      (_, name) => `const ${name} = window.ReactDOM;`
    )

    result = result.replace(
      /import\s+\{([^}]+)\}\s+from\s+['\"]react-dom\/client['\"]\s*;?/g,
      (_, names) => {
        const trimmed = names
          .split(',')
          .map(n => n.trim())
          .filter(Boolean)
          .join(', ')
        return `const { ${trimmed} } = window.ReactDOM;`
      }
    )

    result = result.replace(
      /import\s+(\w+)\s+from\s+['\"]react-dom['\"]\s*;?/g,
      (_, name) => `const ${name} = window.ReactDOM;`
    )

    result = result.replace(
      /import\s+\{([^}]+)\}\s+from\s+['\"]react-dom['\"]\s*;?/g,
      (_, names) => {
        const trimmed = names
          .split(',')
          .map(n => n.trim())
          .filter(Boolean)
          .join(', ')
        return `const { ${trimmed} } = window.ReactDOM;`
      }
    )

    return result
  }

  extractLocalImports(code) {
    const imports = []
    const regex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['\"](\.[^'\"]+)['\"]\s*;?/g
    let match

    while ((match = regex.exec(code))) {
      const raw = match[1]
      const normalized = raw.replace(/\.(jsx|tsx|ts|js|mjs|cjs)$/i, '')
      imports.push({
        raw,
        normalized,
        statement: match[0]
      })
    }

    return imports
  }
}

LiveFront.ReactCompiler = new ReactCompiler()
