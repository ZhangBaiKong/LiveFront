# LiveFront — 理解摘要 (CONTEXT.md)

## 这是什么项目
LiveFront 是一个“看到效果，再写代码”的可视化前端开发桌面应用，基于 Electron。
核心理念：**LiveFront = 核心内核 + N 个可插拔模块（拼图）**。

## 我理解到的关键设计
1. **拼图架构（Module System 1.1）**
   - 每个模块 = 一块拼图，独立封装：UI、逻辑、事件、命令、快捷键、菜单项、右键菜单、数据。
   - 新增功能 = 新建模块文件夹 + 在 `index.html` 加一行 `<script>`。
   - 删除功能 = 注释对应 `<script>`，其余系统不受影响。

2. **目录结构（最终版）**
   - `src/renderer/index.html`：主页面，按顺序加载 script。
   - `src/renderer/css/`：设计系统（`variables.css`）、布局（`layout.css`）、核心样式（`core.css`）、主题（`themes/dark.css|light.css`）。
   - `src/renderer/core/`：不可插拔核心（`app.js`、`module-loader.js`、`module-registry.js`、`event-bus.js`、`command-registry.js`、`shortcut-manager.js`、`menu-manager.js`、`context-menu.js`、`storage.js`、`ipc-client.js`、`shared-services.js`、`layout-manager.js`、`dom-utils.js`）。
   - `src/renderer/modules/`：可插拔模块（如 `filetree/`、`editor/`、`preview/`、`props-panel/`、`terminal/`、`ai/`、`modline/`、`effectline/`、`materials/`、`git/`、`build/`）。
   - `src/renderer/assets/`、`src/renderer/vendor/`：静态资源与第三方库。

3. **模块 Manifest 格式（1.3）**
   - 模块通过 `LiveFront.modules.register(manifest)` 自注册。
   - manifest 包含：`id/name/version/description`、`dependencies/optionalDependencies`、`ui`(sidebar/rightPanel/modline/effectline/statusbar/toolbar)、`commands`、`shortcuts`、`menus`、`contextMenus`、`events`(emits/listens)、`ipc`(invokes/listens)、`state`、`init(ctx)`、`destroy()`。

4. **核心内核服务（1.4）**
   - `EventBus`：`on/off/emit/once`，模块间通信。
   - `Commands`：`register/unregister/execute/list`，统一命令管理。
   - `Shortcuts`：快捷键绑定与 `when` 条件。
   - `Layout`：面板显示/隐藏、尺寸、保存/恢复。
   - `Services`：`fileSystem/dialog/ai/preview/app`。
   - `Storage`：应用级 KV + 项目级存储/快照。
   - `ModuleLoader`：注册、拓扑排序、initAll、构建菜单/快捷键/状态栏。
   - `ContextMenu`：按 target 聚合菜单项。

5. **index.html 加载顺序（1.5）**
   - 先加载 CSS（variables/reset/layout/core/scrollbar/themes）。
   - 再加载核心 JS（dom-utils/event-bus/storage/ipc-client/shared-services/command-registry/shortcut-manager/menu-manager/context-menu/layout-manager/module-registry/module-loader）。
   - 再加载模块 JS（各 `modules/*/index.js`）。
   - 加载模块 CSS。
   - 最后加载 `core/app.js`。

6. **加新拼图（1.6）**
   - 新建 `modules/<name>/`，写 `index.js`(manifest)、逻辑文件、CSS。
   - 在 `index.html` 增加 `<script>` 与 `<link>`，即可自动集成到菜单/快捷键/右键菜单。

7. **用户操作流程（2.x）**
   - 启动流程：加载核心+模块 → 恢复布局 → 欢迎页或上次项目。
   - 打开项目：对话框/拖拽/最近项目 → `readDirTree` → filetree → 自动识别入口 → 预览/编辑器。
   - 编辑→预览：input → 防抖 → write → chokidar → WebView 刷新。
   - 元素选中联动：element-picker → postMessage → `element:selected` → editor/props-panel/modline/effectline。
   - 修改线：属性面板/手动/AI → `modification:*` 事件流。
   - 效果线：选中元素快捷工具栏/面板/自然语言 → effect:* → 注入预览 + 写入项目。
   - AI 对话：注入上下文 → 代理请求 → 应用全部/部分/智能合并 → 记录修改线。

8. **模块间通信协议（3.x）**
   - 全局事件清单覆盖：project/file/editor/preview/modline/effectline/ai/statusbar/layout。

9. **IPC 完整接口（4.x）**
   - 渲染→主进程：fs/dialog/window/ai/terminal/app/shell。
   - 主进程→渲染进程：fs:file-*、terminal:data/exit、app:update-available。

10. **编辑器标配功能（5.x）**
    - 右键菜单（按区域）：editor/filetree/preview/modline-tag/effectline-effect。
    - 命令面板：`Ctrl+Shift+P`，分组显示。
    - 设置页面：外观/编辑器/预览/AI/终端/快捷键/素材库/项目。

11. **数据存储方案（6）**
    - 应用级：`electron-store`（可加密 API Key）。
    - 项目级：`.livefront.json`（entry/ignore/preview/effects）。
    - 快照：`.livefront/snapshots/vN.json`（回退用）。

12. **WebView 预览技术细节（7）**
    - 不用 `file://`、不用 `iframe srcdoc`。
    - 主进程启动 HTTP 服务（随机端口），WebView 加载 `http://localhost:port`。
    - HTML 注入增强脚本（元素选中/指令）、效果代码、Tailwind CDN（可选）。
    - 热重载：chokidar → IPC → 防抖 → WebView reload。

13. **素材库数据源（8）**
    - 推荐方案 A：随软件打包离线素材（`resources/materials/...` + `meta.json`）。
    - 应用到项目：按类型决定插入方式（组件/动效/字体/图标/配色）。

14. **MVP 迁移映射（9）**
    - `web/` → `src/renderer/`：CSS 变量/布局/预览/面板/修改线/模态/逻辑拆分与重写。

## 我将执行 Phase 0 的理解（目标与成功标准）
- 目标：为 LiveFront 建立可运行的项目脚手架，验证“拼图模块系统”可行性。
- 包含：
  1) 读取已有 MVP（`web/`）并按映射迁移可复用代码。
  2) 搭建 Electron 项目（main/renderer/preload、vite、electron-builder）。
  3) 实现模块化核心：module-registry、event-bus、command-registry、shortcut-manager、menu-manager、context-menu、layout-manager、storage、ipc-client、shared-services、module-loader、dom-utils、app.js。
  4) 创建首个模块（filetree）并验证注册/事件/基础交互。
  5) 搭建 UI 骨架：标题栏、菜单栏、四栏主体、状态栏、欢迎页、CSS 变量/布局/滚动条。
  6) 主进程服务：窗口、菜单、IPC、文件系统、preview-server。
  7) 状态管理拆分与基础快捷键。
- 成功标准：
  - `npm install && npm run dev` 正常启动。
  - 四栏布局完整、菜单栏动态渲染、filetree 能打开目录并展示、分隔线可拖拽、`Ctrl+B` 切换侧边栏。
  - `LiveFront.modules.getAll()` 可列出模块；EventBus 可观测事件；无控制台错误。
