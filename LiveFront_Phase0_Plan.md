# LiveFront Phase 0 ¡ª Execution Plan (Project root: E:\wodeAI\LiveFront)

## Goal
Create a runnable project scaffold for LiveFront that proves the ¡°puzzle module¡± architecture works end-to-end:
- Electron app starts cleanly
- Four-column UI renders (title bar, menu bar, 3-column body, status bar)
- Core module system is wired (registry, loader, events, commands, shortcuts, menus, context menus, layout)
- First module (filetree) loads via manifest, renders in sidebar, and emits file events
- Welcome page shows when no project is open

## Workstreams and Tasks

### 1) MVP inventory and migration (read-only analysis first)
- Inventory existing files under `web/` (if present) and map reusable code to new structure.
- Reuse targets:
  - CSS variables ¡ú `src/renderer/css/variables.css`
  - Layout patterns ¡ú `src/renderer/css/layout.css` (rewrite to four-column)
  - Preview/editor/panel CSS ¡ú corresponding module CSS files
  - Modal CSS ¡ú global CSS
  - JS logic split: store.js ¡ú `core/shared-services.js` + module-local stores
  - Preview logic rewrite for WebView + HTTP server model

### 2) Electron project setup (non-framework, minimal deps)
- `package.json` scripts: `dev`, `build`, `build:win`/`mac`/`linux`
- Dependencies (Phase 0 only): `electron`, `electron-builder`, `chokidar`
- Vite (renderer/dev tooling) or manual dev setup (choose one; recommend `electron-vite` for DX)
- `electron-builder.yml` placeholder for packaging

### 3) Core module system (renderer)
Implement in `src/renderer/core/`:
- `module-registry.js` (register/get/getAll)
- `module-loader.js` (topo sort + initAll + build menus/shortcuts/statusbar)
- `event-bus.js` (on/off/emit/once)
- `command-registry.js` (register/execute/list/unregister)
- `shortcut-manager.js` (bindings + when conditions)
- `menu-manager.js` (dynamic menubar from modules)
- `context-menu.js` (aggregate by target)
- `layout-manager.js` (panels/sizes/visibility/persistence)
- `storage.js` (app KV + project scope; Phase 0 can be JSON-backed)
- `ipc-client.js` (Promise wrapper over preload API)
- `shared-services.js` (fs/dialog/preview/ai/app)
- `dom-utils.js` (helpers)
- `app.js` (bootstrap + restore layout + load project or welcome)

### 4) First module (filetree)
- `modules/filetree/index.js` manifest with sidebar UI + commands + shortcuts + menus
- Implement:
  - open folder via dialog
  - read directory tree (IPC)
  - render tree
  - click file ¡ú emit `file:opened`
  - placeholder right-click menu

### 5) UI skeleton and CSS
- `index.html` with four-column layout
- CSS files: `variables.css`, `reset.css`, `layout.css`, `core.css`, `scrollbar.css`, `themes/dark.css`, `themes/light.css`
- Welcome page block (no project state)
- Resizable gutters between sidebar/main/panel

### 6) Main process services
- `src/main/index.js` (window create, load index.html, persist window state)
- `main/window.js` (bounds/maximized persistence)
- `main/menu.js` (native menu with devtools in dev)
- `main/ipc.js` (fs/dialog/window/app/shell channels)
- `main/filesystem.js` (readDirTree + CRUD + watch/unwatch)
- `main/preview-server.js` (localhost server + inject scripts for preview)
- `src/preloader/index.js` (contextBridge API surface)

### 7) State model (Phase 0 minimal)
- Core app state: project path, tree, open files, active file, dirty flags
- Module-local state: filetree selection; others later

### 8) Base shortcuts (core)
- Register core shortcuts from Phase 0 list; wire through Commands.execute

## Assumptions / Defaults
- Renderer is vanilla HTML/CSS/JS (no frameworks)
- Phase 0 preview-server can be scaffolded but WebView interactions can be validated later
- Storage backend for Phase 0 can be JSON files; `electron-store` optional
- Use `electron-vite` for dev unless you prefer a different bundler

## Acceptance Criteria
- `npm install && npm run dev` opens Electron window
- Four-column layout visible; welcome page shows when no project
- Filetree module opens a folder and displays directory tree
- Selecting a file emits `file:opened` (visible via console log or subscriber)
- `Ctrl+B` toggles sidebar visibility
- Menu bar renders dynamically from modules
- `LiveFront.modules.getAll()` lists loaded modules
- No console errors

## Risks / Unknowns
- Preview injection strategy may need iterative tweaks (post-Phase 0)
- Some MVP logic may not map 1:1 and must be rewritten for module boundaries
- Terminal/AI/Materials modules are out-of-scope for Phase 0

## Next Steps
- Confirm tooling choice (electron-vite vs custom)
- Confirm minimal deps set
- Approve this plan; then I¡¯ll switch to execution and implement the scaffold
