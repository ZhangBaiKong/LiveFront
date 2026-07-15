/* LiveFront Vue Compiler — browser-side Vue SFC compilation */
window.LiveFront = window.LiveFront || {}

class VueCompiler {
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
          console.error('[VueCompiler] Failed to load Sucrase:', e)
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

  async compile(vueCode, filename) {
    const mod = await this._ensureSucrase()
    if (!mod?.transform) {
      return { code: '', error: 'Sucrase is not available' }
    }

    try {
      const parsed = this._parseSFC(vueCode)
      const dependencies = this._extractDependencies(parsed.script || parsed.scriptSetup || '')
      const compiledScript = await this._compileScript(parsed.script || parsed.scriptSetup || '', filename, mod)
      
      return {
        template: parsed.template,
        script: compiledScript,
        styles: parsed.styles,
        setup: !!parsed.scriptSetup,
        dependencies,
        error: null
      }
    } catch (e) {
      console.warn('[VueCompiler] Compile failed:', filename, e)
      return { code: '', error: e?.message || String(e) }
    }
  }

  _parseSFC(vueCode) {
    const result = {
      template: '',
      script: '',
      scriptSetup: '',
      styles: []
    }

    const templateMatch = vueCode.match(/<template[^>]*>([\s\S]*?)<\/template>/i)
    if (templateMatch) {
      result.template = templateMatch[1].trim()
    }

    const scriptSetupMatch = vueCode.match(/<script\s+setup[^>]*>([\s\S]*?)<\/script>/i)
    if (scriptSetupMatch) {
      result.scriptSetup = scriptSetupMatch[1].trim()
    }

    const scriptMatch = vueCode.match(/<script(?!\s+setup)[^>]*>([\s\S]*?)<\/script>/i)
    if (scriptMatch) {
      result.script = scriptMatch[1].trim()
    }

    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
    let styleMatch
    while ((styleMatch = styleRegex.exec(vueCode)) !== null) {
      result.styles.push(styleMatch[1].trim())
    }

    return result
  }

  _extractDependencies(scriptCode) {
    const deps = []
    const regex = /import\s+.*?from\s+['"](\.[^'"]+)['"]\s*;?/g
    let match

    while ((match = regex.exec(scriptCode)) !== null) {
      const raw = match[1]
      const normalized = raw.replace(/\.(vue|js|ts|jsx|tsx)$/i, '')
      deps.push({
        raw,
        normalized,
        statement: match[0]
      })
    }

    return deps
  }

  async _compileScript(scriptCode, filename, sucrase) {
    if (!scriptCode) return ''

    let result = scriptCode

    result = result.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]vue['"]\s*;?/g,
      (_, names) => {
        const trimmed = names.split(',').map(n => n.trim()).filter(Boolean).join(', ')
        return `const { ${trimmed} } = Vue;`;
      }
    )

    result = result.replace(
      /import\s+(\w+)\s+from\s+['"]vue['"]\s*;?/g,
      (_, name) => `const ${name} = Vue;`;
    )

    result = result.replace(
      /import\s+.*?from\s+['"]\.[^'"]+['"]\s*;?/g,
      ''
    )

    result = result.replace(
      /import\s+['"]\.[^'"]+['"]\s*;?/g,
      ''
    )

    result = result.replace(
      /import\s+.*?from\s+['"][^'."][^'"]*['"]\s*;?/g,
      ''
    )

    result = result.replace(
      /export\s+default\s+/,
      'const __default = '
    )

    try {
      const transformed = sucrase.transform(result, {
        transforms: ['typescript'],
        production: true
      })
      return transformed.code || result
    } catch (e) {
      console.warn('[VueCompiler] Sucrase transform failed:', filename, e)
      return result
    }
  }

  extractLocalImports(code) {
    const imports = []
    const regex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"](\.[^'"]+)['"]\s*;?/g
    let match

    while ((match = regex.exec(code))) {
      const raw = match[1]
      const normalized = raw.replace(/\.(vue|js|ts|jsx|tsx)$/i, '')
      imports.push({
        raw,
        normalized,
        statement: match[0]
      })
    }

    return imports
  }
}

LiveFront.VueCompiler = new VueCompiler()
