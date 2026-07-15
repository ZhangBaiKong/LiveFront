/* LiveFront Framework Detector — lightweight project classification */
window.LiveFront = window.LiveFront || {}

class FrameworkDetector {
  async detect(projectPath) {
    const fromPkg = await this.detectFromPackageJson(projectPath)
    if (fromPkg.framework !== 'html') {
      return {
        ...fromPkg,
        projectPath,
        source: 'package.json'
      }
    }

    const fromFs = await this.detectFromFileSystem(projectPath)
    return {
      ...fromFs,
      projectPath,
      source: fromFs.source || 'filesystem'
    }
  }

  async detectFromPackageJson(projectPath) {
    const pkgPath = projectPath + '/package.json'
    const exists = await LiveFront.Services.fileSystem.exists(pkgPath)
    if (!exists) {
      return this._emptyResult()
    }

    try {
      const raw = await LiveFront.Services.fileSystem.readFile(pkgPath)
      const pkg = JSON.parse(raw || '{}')
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
      const scripts = pkg.scripts || {}

      let framework = 'html'
      if (deps.react || deps['react-dom']) framework = 'react'
      else if (deps.vue) framework = 'vue'
      else if (deps.svelte) framework = 'svelte'

      return {
        framework,
        hasNodeModules: false,
        hasBuildScript: Boolean(
          scripts.build || scripts.start || scripts.dev || scripts['electron:dev']
        ),
        dependencies: deps,
        packageJson: pkg
      }
    } catch (e) {
      console.warn('[FrameworkDetector] Failed to read package.json:', e)
      return this._emptyResult()
    }
  }

  async detectFromFileSystem(projectPath) {
    const MAX_FILES = 220
    let foundReact = false
    let foundVue = false
    let foundSvelte = false
    let foundJsx = false
    let foundTsx = false
    let foundVueFile = false
    let foundSvelteFile = false
    let foundHtml = false
    let collected = 0

    const walk = async (dir, depth) => {
      if (depth > 6 || collected >= MAX_FILES) return
      let entries = []
      try {
        entries = await LiveFront.Services.fileSystem.readDir(dir)
      } catch {
        return
      }

      for (const entry of entries) {
        if (collected >= MAX_FILES) break
        const name = entry.name || (entry.path || '').split(/[/\\]/).pop()
        if (!name) continue
        if (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'out' || name === '.livefront') continue

        if (entry.type === 'directory') {
          await walk(entry.path, depth + 1)
          continue
        }

        collected++
        const ext = name.split('.').pop().toLowerCase()
        if (ext === 'jsx') foundJsx = true
        if (ext === 'tsx') foundTsx = true
        if (ext === 'vue') foundVueFile = true
        if (ext === 'svelte') foundSvelteFile = true
        if (ext === 'html' || ext === 'htm') foundHtml = true

        if (name === 'package.json') {
          try {
            const raw = await LiveFront.Services.fileSystem.readFile(entry.path)
            const pkg = JSON.parse(raw || '{}')
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
            if (deps.react || deps['react-dom']) foundReact = true
            if (deps.vue) foundVue = true
            if (deps.svelte) foundSvelte = true
          } catch {}
        }
      }
    }

    await walk(projectPath, 0)

    let framework = 'html'
    if (foundReact || foundJsx || foundTsx) framework = 'react'
    else if (foundVue || foundVueFile) framework = 'vue'
    else if (foundSvelte || foundSvelteFile) framework = 'svelte'

    return {
      framework,
      hasNodeModules: false,
      hasBuildScript: false,
      source: foundReact ? 'package.json' : 'extensions'
    }
  }

  _emptyResult() {
    return {
      framework: 'html',
      hasNodeModules: false,
      hasBuildScript: false,
      dependencies: {},
      packageJson: {}
    }
  }
}

LiveFront.FrameworkDetector = new FrameworkDetector()
