# LiveFront v2.0 技术方案设计

## 一、项目目录结构

### 1.1 完整目录树

```text
livefront/
├── src/
│   ├── main/
│   │   ├── index.js
│   │   │   - 主进程入口：创建 BrowserWindow、初始化托盘与菜单、加载 preload、启动核心服务。
│   │   │   - 负责 IPC 注册、应用生命周期管理、全局错误兜底、单实例锁。
│   │   ├── preview-server.js
│   │   │   - 内置 HTTP 预览服务：基于本地静态目录启动站点预览。
│   │   │   - 支持自动换端口、热更新触发、URL 获取、设备视图无刷新切换。
│   │   ├── ai-service.js
│   │   │   - 封装 MiMo API 调用、SSE 流式收发、取消请求、错误重试。
│   │   │   - 负责将渲染层上下文组装为 API 请求体，并回传分片到渲染进程。
│   │   ├── terminal-manager.js
│   │   │   - 管理多终端实例：创建、写入、resize、退出、输出回传。
│   │   │   - 隔离不同项目/模块的终端，避免阻塞 UI 线程。
│   │   └── page-analyzer.js
│   │       - 页面结构分析引擎：负责生成拓扑图数据。
│   │       - 提供本地规则分析与 AI 辅助分析两条路径，并缓存分析结果。
│   │
│   ├── preload/
│   │   └── index.js
│   │       - 通过 contextBridge 暴露安全 API：LiveFront.ipc / LiveFront.app / LiveFront.shell。
│   │       - 限定可调用频道白名单，校验来源，避免主进程能力泄露。
│   │
│   └── renderer/
│       ├── index.html
│       │   - 单页入口：承载布局框架、区域容器、加载脚本与基础 meta。
│       ├── main.js
│       │   - 渲染进程入口：初始化 EventBus、模块注册表、状态、快捷键、菜单桥接。
│       │   - 按依赖顺序加载模块，并触发 ready 生命周期。
│       ├── core/
│       │   ├── module-registry.js
│       │   │   - 模块注册与依赖解析：管理 manifest、init、commands、shortcuts、menus。
│       │   ├── event-bus.js
│       │   │   - 全局事件总线：发布/订阅、一次性监听、命名空间事件、调试日志。
│       │   ├── shared-services.js
│       │   │   - 统一服务层：封装 IPC 调用、全局状态、常用 UI 提示、任务队列。
│       │   ├── storage.js
│       │   │   - 本地持久化服务：读写 localStorage、合并默认值、迁移旧版本配置。
│       │   └── lifecycle.js
│       │       - 模块生命周期：beforeInit / init / afterInit / dispose，统一异常捕获。
│       ├── modules/
│       │   ├── filetree/
│       │   │   ├── index.js
│       │   │   │   - 模块入口：注册 commands、menus、shortcuts、事件监听。
│       │   │   ├── filetree-service.js
│       │   │   │   - 读取目录结构、构建树、刷新差异、watch/unwatch 文件系统。
│       │   │   ├── filetree-view.js
│       │   │   │   - 渲染文件树视图、节点展开、搜索、虚拟滚动容器。
│       │   │   └── filetree-state.js
│       │   │       - 缓存当前项目路径、展开状态、选中文件、最近访问记录。
│       │   ├── preview/
│       │   │   ├── index.js
│       │   │   │   - 模块入口：管理预览生命周期、事件联动、刷新策略。
│       │   │   ├── preview-controller.js
│       │   │   │   - 控制 WebView 加载、postMessage 通信、设备模式、重载。
│       │   │   ├── preview-service.js
│       │   │   │   - 与主进程 preview-server 协作：start/stop/getUrl、端口协商。
│       │   │   └── preview-injector.js
│       │   │       - 向 WebView 注入选择器、高亮遮罩、样式钩子、元素采集脚本。
│       │   ├── props-panel/
│       │   │   ├── index.js
│       │   │   │   - 模块入口：监听元素选中事件、显示属性面板。
│       │   │   ├── props-view.js
│       │   │   │   - 属性面板 UI：标签、类名、尺寸、样式控件、分组布局。
│       │   │   ├── props-service.js
│       │   │   │   - 属性读写、单位解析、样式计算、校验、变更合并。
│       │   │   └── props-binding.js
│       │   │       - 与 preview 联动：实时注入临时样式、回写真实 CSS、撤销栈。
│       │   ├── ai/
│       │   │   ├── index.js
│       │   │   │   - 模块入口：初始化聊天 UI、命令、AI 服务绑定。
│       │   │   ├── ai-service-client.js
│       │   │   │   - 封装渲染侧 AI 请求：构建上下文、调用 IPC、管理流状态。
│       │   │   ├── ai-view.js
│       │   │   │   - 对话面板：消息列表、输入区、流式更新、错误提示。
│       │   │   ├── ai-context-builder.js
│       │   │   │   - 上下文构建器：文件结构、选中元素、历史对话、系统提示词。
│       │   │   └── ai-response-parser.js
│       │   │       - 解析 AI 输出：区分文本、代码块、拓扑 JSON、操作指令。
│       │   ├── terminal/
│       │   │   ├── index.js
│       │   │   │   - 模块入口：终端 Tab 管理、命令注册。
│       │   │   ├── terminal-view.js
│       │   │   │   - 渲染终端 UI、容器布局、输入焦点、输出滚动。
│       │   │   └── terminal-service.js
│       │   │       - 调用主进程 terminal-manager，转发写入、resize、退出事件。
│       │   ├── workflow-topology/
│       │   │   ├── index.js
│       │   │   │   - 模块入口：接收页面刷新事件，触发分析。
│       │   │   ├── topology-service.js
│       │   │   │   - 请求主进程分析、缓存结果、转换模块/连线数据。
│       │   │   ├── topology-view.js
│       │   │   │   - 拓扑图渲染：节点、连线、交互、点击聚焦。
│       │   │   └── topology-interaction.js
│       │   │       - 拓扑节点点击映射：联动预览高亮与属性面板。
│       │   ├── materials/
│       │   │   ├── index.js
│       │   │   │   - 模块入口：素材分类、搜索、拖拽插入命令。
│       │   │   ├── materials-repository.js
│       │   │   │   - 加载本地/远程素材索引、分类检索、缓存策略。
│       │   │   └── materials-view.js
│       │   │       - 素材面板 UI、预览、拖拽应用交互。
│       │   └── settings/
│       │       ├── index.js
│       │       │   - 模块入口：设置命令、菜单、持久化监听。
│       │       ├── settings-service.js
│       │       │   - 配置读写、默认值合并、校验、变更通知。
│       │       └── settings-view.js
│       │           - 设置面板 UI、分组展示、表单交互。
│       ├── css/
│       │   ├── variables.css
│       │   │   - 主题变量、间距、圆角、阴影、设备断点、Z-index 规范。
│       │   ├── layout.css
│       │   │   - 全局三栏布局、响应式容器、分栏比例与拖拽分隔。
│       │   └── components.css
│       │       - 通用组件样式：按钮、输入框、Toast、模态框、列表。
│       └── assets/
│           ├── icons/
│           │   - 模块图标、操作图标、状态图标、拓扑节点图例。
│           └── templates/
│               - 默认网页模板、空白页模板、拓扑示例模板。
│
├── docs/
│   ├── PRD.md
│   │   - 产品需求与优先级定义，作为技术方案的唯一需求来源。
│   ├── COMPETITOR_ANALYSIS.md
│   │   - 竞品分析与差异化依据，支撑技术路线选择。
│   └── TECHNICAL_DESIGN.md
│       - 本技术方案文档，定义架构、接口、数据流与实现策略。
│
├── package.json
│   - 项目依赖、脚本入口、Electron 主进程与 electron-vite 配置说明。
└── electron.vite.config.mjs
    - electron-vite 构建配置：主进程、预加载、渲染进程三入口打包与别名管理。
```

---

## 二、模块接口设计

### 2.1 模块注册机制

```text
模块 manifest 结构（ModuleManifest）
{
  id: string;                          // 唯一模块标识，例如 'preview'
  name?: string;                       // 显示名称
  version?: string;                    // 模块版本
  dependencies?: string[];             // 依赖模块 id，例如 ['filetree', 'settings']
  provides?: string[];                 // 对外能力标识，例如 ['preview.refresh']
  commands?: CommandDefinition[];      // 注册命令
  shortcuts?: ShortcutDefinition[];    // 快捷键绑定
  menus?: MenuDefinition[];            // 菜单项
  init(ctx: ModuleContext): Promise<void> | void;   // 初始化入口
  dispose?(): Promise<void> | void;                  // 可选释放逻辑
}

CommandDefinition
{
  id: string;                          // 命令唯一 ID，例如 'preview.refresh'
  title: string;                       // 命令面板显示文本
  shortcut?: string;                   // 可选快捷键
  when?: (ctx: ModuleContext) => boolean;  // 是否在当前上下文可用
  run(ctx: ModuleContext, ...args: unknown[]): Promise<void> | void;
}

ShortcutDefinition
{
  key: string;                         // 按键组合，例如 'Ctrl+Shift+R'
  commandId: string;                   // 触发的命令 ID
  scope?: 'global' | 'renderer';      // 快捷键作用域
}

MenuDefinition
{
  id: string;                          // 菜单项 ID
  parent: string;                      // 菜单位置锚点
  label: string;                       // 文本
  commandId: string;                   // 触发命令
  order?: number;                      // 排序权重
}

ModuleContext
{
  app: { version: string; isReady: boolean };
  ipc: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    send(channel: string, ...args: unknown[]): void;
    on(channel: string, listener: (...args: unknown[]) => void): () => void;
  };
  bus: {
    on(event: string, listener: (...args: unknown[]) => void): () => void;
    once(event: string, listener: (...args: unknown[]) => void): () => void;
    emit(event: string, ...args: unknown[]): void;
  };
  state: Record<string, unknown>;
  storage: {
    get<T>(key: string, defaultValue?: T): T;
    set(key: string, value: unknown): void;
  };
  logger: {
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
  };
}
```

注册流程：
1. `main.js` 初始化 `module-registry` 与 `lifecycle`。
2. 每个模块导出默认 manifest。
3. 注册器校验 id 唯一性，收集 `commands/shortcuts/menus`。
4. 按依赖拓扑排序，先初始化 `settings/event-bus/storage`，再初始化业务模块。
5. 依次执行 `init(ctx)`，失败时记录错误并继续非依赖模块初始化。
6. 注册命令与快捷键到命令面板和菜单桥接层。

初始化顺序建议：
```text
settings -> filetree -> preview -> props-panel -> ai -> terminal -> workflow-topology -> materials
```

### 2.2 各模块接口定义

#### filetree 模块

```text
接口
- openFolder(path: string): Promise<TreeModel>
  - 输入：项目根目录绝对路径
  - 输出：结构化目录树（TreeModel）
- getTree(): TreeModel
  - 输出：当前缓存树对象
- onFileSelect(callback: (payload: FileSelectedPayload) => void): () => void
  - 返回取消监听函数

输入/输出数据结构
TreeModel = {
  rootPath: string;
  nodes: TreeNode[];
  updatedAt: number;
}

TreeNode = {
  id: string;              // 路径哈希或相对路径唯一键
  name: string;            // 文件/目录名
  path: string;            // 绝对路径
  type: 'file' | 'dir';
  children?: TreeNode[];
  size?: number;
  ext?: string;
}

FileSelectedPayload = {
  path: string;            // 被选中文件绝对路径
  name: string;
  ext: string;
  from: 'click' | 'keyboard' | 'command';
}

事件
- filetree:file-selected(FileSelectedPayload)
- filetree:folder-opened({ rootPath: string; nodeCount: number; })
```

#### preview 模块

```text
接口
- startServer(projectPath: string): Promise<{ url: string; port: number }>
- stopServer(): Promise<void>
- refresh(target?: 'all' | 'styles' | 'scripts'): Promise<void>
- setDevice(device: DeviceMode): void
- getUrl(): string

输入/输出数据结构
DeviceMode = 'desktop' | 'tablet' | 'mobile';

WebViewMessage =
  | { type: 'element:selected'; payload: SelectedElement }
  | { type: 'element:hover'; payload: HoverElement }
  | { type: 'preview:error'; payload: { message: string; stack?: string } };

SelectedElement = {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  bbox: { x: number; y: number; width: number; height: number };
  computedStyle: Record<string, string>;
  filePath?: string;
  lineHint?: number;
};

通信协议
- 主进程 -> 渲染进程：preview:ready | preview:refreshed | preview:error
- 渲染进程 -> WebView：window.postMessage({ channel: 'livefront', action, payload })
- WebView -> 渲染进程：window.parent.postMessage({ channel: 'livefront', ... }, origin)
- 校验规则：仅接受 trusted origin，拒绝未知 channel 消息。
```

#### props-panel 模块

```text
接口
- showElementInfo(info: SelectedElement): void
- updateProperty(change: PropertyChange): Promise<PropertyUpdateResult>
- hide(): void

输入/输出数据结构
PropertyChange = {
  selector: string;
  property: string;         // 例如 'font-size'
  value: string;            // 例如 '18px'
  important?: boolean;
  source?: 'user' | 'ai' | 'material';
};

PropertyUpdateResult = {
  success: boolean;
  appliedValue: string;
  previewInjected: boolean;
  fileUpdated: boolean;
  error?: string;
};

事件
- props:property-changed(PropertyChange)
- props:element-deselected({ reason: 'user' | 'navigation' | 'refresh' })
```

#### ai 模块

```text
接口
- sendMessage(text: string, context?: AiContextPayload): Promise<string>
- cancelStream(requestId?: string): void
- setProvider(config: AiProviderConfig): void

输入/输出数据结构
AiProviderConfig = {
  provider: 'mimo' | 'custom';
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  maxTokens?: number;
};

AiContextPayload = {
  projectPath: string;
  fileTreeSummary: string;
  currentFile?: { path: string; content: string };
  selectedElement?: SelectedElement;
  previewUrl?: string;
  recentMessages?: AiMessage[];
};

AiMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
};

事件
- ai:stream-chunk({ requestId: string; delta: string; })
- ai:stream-end({ requestId: string; fullText: string; })
- ai:stream-error({ requestId: string; message: string; code?: string; })

上下文构建逻辑
1. 始终包含系统提示词与用户当前输入。
2. 必须包含项目相对文件树摘要（限制长度）。
3. 按需追加当前打开文件、选中元素、预览 URL。
4. 最近对话保留最近 N 条，避免上下文膨胀。
```

#### terminal 模块

```text
接口
- create(options?: TerminalCreateOptions): Promise<string>
- write(terminalId: string, data: string): void
- resize(terminalId: string, cols: number, rows: number): void
- kill(terminalId: string): Promise<void>

输入/输出数据结构
TerminalCreateOptions = {
  id?: string;
  cwd?: string;
  shell?: string;
  env?: Record<string, string>;
};

TerminalOutputPayload = {
  terminalId: string;
  data: string;
};

TerminalExitPayload = {
  terminalId: string;
  code: number | null;
  signal?: string | null;
};

事件
- terminal:data(TerminalOutputPayload)
- terminal:exit(TerminalExitPayload)
```

#### workflow-topology 模块

```text
接口
- analyze(input: TopologyAnalyzeInput): Promise<TopologyGraph>
- getTopology(): TopologyGraph
- refreshTopology(): Promise<TopologyGraph>

输入/输出数据结构
TopologyAnalyzeInput = {
  html: string;
  scriptSnippets?: string[];
  url?: string;
  strategy?: 'rule' | 'ai' | 'auto';
};

TopologyGraph = {
  version: number;
  modules: TopologyModule[];
  connections: TopologyConnection[];
  analyzedAt: number;
  sourceHash: string;
};

TopologyModule = {
  id: string;
  name: string;
  type: 'navigation' | 'hero' | 'content' | 'form' | 'footer' | 'custom';
  selector: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  tags?: string[];
};

TopologyConnection = {
  id: string;
  from: string;           // module id
  to: string;             // module id or endpoint id
  type: 'navigation' | 'interaction' | 'api' | 'state';
  label?: string;
  meta?: Record<string, unknown>;
};

事件
- topology:updated(TopologyGraph)
- topology:module-clicked({ moduleId: string; selector: string; })
```

#### materials 模块

```text
接口
- getCategories(): MaterialCategory[]
- getMaterials(categoryId: string): MaterialItem[]
- apply(materialId: string, target?: ApplyTarget): Promise<ApplyResult>

输入/输出数据结构
MaterialCategory = {
  id: string;
  name: string;
  count: number;
};

MaterialItem = {
  id: string;
  name: string;
  categoryId: string;
  previewImage?: string;
  content: string;         // 可插入片段（HTML/CSS/JS）
  version?: string;
};

ApplyTarget = {
  mode: 'append' | 'replace' | 'insert';
  filePath?: string;
  selector?: string;
};

ApplyResult = {
  success: boolean;
  updatedFiles: string[];
  previewRefreshed: boolean;
};

事件
- materials:applied({ materialId: string; updatedFiles: string[]; })
```

#### settings 模块

```text
接口
- get<T>(key: string): T
- set(key: string, value: unknown): void

输入/输出数据结构
SettingsKeyMap = {
  'ai.provider': AiProviderConfig;
  'ai.historySize': number;
  'preview.defaultDevice': DeviceMode;
  'preview.portPreference': number;
  'project.lastOpenedPath': string;
  'ui.theme': 'light' | 'dark';
  'terminal.defaultShell': string;
};

事件
- settings:changed({ key: string; value: unknown; prev: unknown; })
```

---

## 三、IPC 通信设计

### 3.1 通信架构

```text
渲染进程                     preload                      主进程
LiveFront.ipc.invoke()  <->  contextBridge  <->  ipcMain.handle()
LiveFront.ipc.send()    <->  contextBridge  <->  ipcMain.on()
LiveFront.ipc.on()      <->  contextBridge  <->  webContents.send()
```

通信约束：
- preload 仅暴露白名单频道。
- 所有异步请求返回统一 `Result<T>` 结构。
- 主进程禁止在渲染请求中直接执行任意路径写入，必须校验项目目录边界。

统一返回结构：
```text
Result<T> = { success: true; data: T; } | { success: false; error: { code: string; message: string; detail?: unknown; }; }
```

### 3.2 IPC 频道设计

```text
命名规则：namespace:method
超时默认：10000 ms
错误码规则：ERR_TIMEOUT / ERR_PARAM / ERR_NOT_FOUND / ERR_PERMISSION / ERR_STATE / ERR_UNKNOWN
```

#### fs 命名空间

```text
fs:readFile
- Request: { path: string; encoding?: 'utf-8' | 'buffer'; }
- Response: { content: string | Uint8Array; lastModified: number; }

fs:writeFile
- Request: { path: string; content: string; createBackup?: boolean; }
- Response: { path: string; backupPath?: string; bytesWritten: number; }

fs:readDir
- Request: { path: string; recursive?: boolean; ignorePatterns?: string[]; }
- Response: { rootPath: string; entries: Array<{ name: string; path: string; type: 'file' | 'dir'; }>; }

fs:watch
- Request: { path: string; recursive?: boolean; debounceMs?: number; }
- Response: { watcherId: string; }

fs:unwatch
- Request: { watcherId: string; }
- Response: { watcherId: string; stopped: boolean; }
```

#### dialog 命名空间

```text
dialog:openFolder
- Request: { title?: string; defaultPath?: string; }
- Response: { canceled: boolean; path?: string; }

dialog:openFile
- Request: { title?: string; filters?: Array<{ name: string; extensions: string[]; }>; defaultPath?: string; }
- Response: { canceled: boolean; path?: string; }

dialog:saveFile
- Request: { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[]; }>; }
- Response: { canceled: boolean; path?: string; }
```

#### ai 命名空间

```text
ai:streamRequest
- Request: {
    requestId: string;
    message: string;
    provider: 'mimo' | 'custom';
    model?: string;
    systemPrompt: string;
    context: {
      projectPath: string;
      fileTreeSummary: string;
      currentFile?: string;
      selectedElement?: SelectedElement;
      history: AiMessage[];
    };
    options?: { temperature?: number; maxTokens?: number; timeoutMs?: number; };
  }
- Response(push): 通过 webContents.send 回传以下事件：
  - ai:stream-chunk
  - ai:stream-end
  - ai:stream-error

ai:cancelStream
- Request: { requestId: string; }
- Response: { requestId: string; canceled: boolean; }
```

#### terminal 命名空间

```text
terminal:create
- Request: { terminalId?: string; cwd?: string; shell?: string; env?: Record<string, string>; }
- Response: { terminalId: string; pid: number; }

terminal:write
- Request: { terminalId: string; data: string; }
- Response: { terminalId: string; written: boolean; }

terminal:resize
- Request: { terminalId: string; cols: number; rows: number; }
- Response: { terminalId: string; cols: number; rows: number; }

terminal:kill
- Request: { terminalId: string; force?: boolean; }
- Response: { terminalId: string; killed: boolean; }
```

#### preview 命名空间

```text
preview:start
- Request: { projectPath: string; preferredPort?: number; }
- Response: { url: string; port: number; }

preview:stop
- Request: { force?: boolean; }
- Response: { stopped: boolean; }

preview:getUrl
- Request: {}
- Response: { running: boolean; url?: string; port?: number; }
```

#### app 命名空间

```text
app:getVersion
- Request: {}
- Response: { appVersion: string; electronVersion: string; }

app:quit
- Request: { force?: boolean; }
- Response: { accepted: boolean; }
```

#### shell 命名空间

```text
shell:openExternal
- Request: { url: string; }
- Response: { opened: boolean; }
```

#### page-analyzer 命名空间

```text
page-analyzer:analyze
- Request: { projectPath: string; html: string; scriptSnippets?: string[]; strategy?: 'rule' | 'ai' | 'auto'; }
- Response: { topology: TopologyGraph; strategyUsed: 'rule' | 'ai'; }

page-analyzer:getTopology
- Request: { projectPath: string; }
- Response: { cached: boolean; topology?: TopologyGraph; }
```

---

## 四、AI Agent 设计

### 4.1 AI 交互架构

```text
用户输入
  -> ai 模块构建上下文
  -> ipc ai:streamRequest
  -> 主进程 ai-service 调用 MiMo API
  -> 流式回传渲染进程
  -> 解析响应中的指令/代码块/拓扑数据
  -> 主进程执行受控文件操作
  -> 触发预览刷新
  -> 触发拓扑图更新
```

AI Agent 的职责边界：
- 负责需求理解、代码生成、文件修改建议、拓扑分析输出。
- 不直接操作文件系统，必须通过主进程受控接口执行写入。

### 4.2 上下文构建

```text
上下文构建表
| 信息               | 来源             | 必要性 | 采集方式                              |
|--------------------|------------------|--------|---------------------------------------|
| 用户当前输入       | 用户             | 必须   | 直接传入                              |
| 项目文件结构       | filetree 模块    | 必须   | 相对路径摘要 + 目录深度裁剪           |
| 当前打开文件内容   | editor/filetree  | 可选   | 最近打开文件内容片段                  |
| 当前选中元素信息   | props-panel      | 可选   | SelectedElement 序列化                |
| 预览区当前状态     | preview          | 可选   | url + device + last refresh time      |
| 历史对话记录       | ai 模块          | 必须   | 最近 N 条压缩摘要                     |
| 系统提示词         | 预置             | 必须   | 启动时加载                            |
```

构建规则：
1. 文件树摘要不超过 `4000` 字符，优先展示根目录与关键目录。
2. 历史消息最多保留最近 20 条，超限后压缩为摘要消息。
3. 选中元素存在时，优先增强局部修改指令精度。
4. 当请求涉及页面结构时，附带当前 HTML 与脚本摘要。

### 4.3 系统提示词设计

```text
你是 LiveFront 的内置 AI 助手，工作在桌面端 Electron 应用中。
你的目标是帮助用户快速创建、修改、分析网页项目，并保持前后端一致性。

能力要求：
1. 理解自己是 LiveFront 内置 AI，能够配合文件树、预览区、属性面板、拓扑图工作。
2. 能生成完整、可运行的 HTML/CSS/JS 代码，优先输出单文件可预览结构。
3. 能修改已有项目文件，避免破坏未提及的功能与结构。
4. 输出文件修改时，使用可解析代码块，并带明确文件路径标记。
5. 能分析页面结构，输出标准化拓扑图 JSON，支持模块与交互关系描述。
6. 能识别并保留前后端关系，避免前端改动导致接口调用丢失。
7. 在需要提升设计质量时，可参考互联网优秀模板的设计风格、布局节奏与配色策略。

输出规范：
- 文本说明直接输出。
- 文件修改输出如下格式：
```html path=src/index.html
...代码...
```
- 拓扑输出如下格式：
```json topology
{...}
```
- 不要在输出中泄露内部实现细节，只输出用户需要的结果。
```

### 4.4 AI 响应解析

```text
解析目标：
1. 区分普通文本、文件代码块、拓扑 JSON、命令建议。
2. 从带路径代码块中提取目标文件与内容。
3. 将合法文件写入请求发送到主进程执行。
4. 写入完成后触发预览刷新与拓扑刷新。
5. 拓扑 JSON 需校验结构完整性后再应用。

解析规则：
- 代码块正则：
  ```<lang> path=<relativePath>
  <content>
  ```
- 拓扑块正则：
  ```json topology
  <json>
  ```
- 代码块优先级：path 必填；lang 可缺省；多个代码块按顺序批量应用。
- 非法块降级为普通文本展示，并记录警告。

执行顺序：
1. 解析全文
2. 校验路径安全性
3. 备份旧文件（若存在）
4. 写入新内容
5. 刷新 preview
6. 若存在 topology 块，刷新拓扑图
7. 返回应用结果摘要给对话面板
```

### 4.5 文件操作安全机制

```text
| 规则                 | 说明                                                                 |
|----------------------|----------------------------------------------------------------------|
| 项目目录边界         | 写入路径必须在当前 projectPath 下，禁止跳出项目根目录                |
| 路径规范化           | 统一转绝对路径并检测 `..`、符号链接逃逸                              |
| 写入前备份           | 每次 AI 修改前创建版本备份，记录到操作日志                           |
| 危险操作确认         | 删除文件、覆盖入口文件、批量修改超过阈值时需二次确认                 |
| 操作日志             | 记录 requestId、时间、路径、操作类型、旧值摘要、新值摘要             |
| 回退支持             | 至少支持最近 10 次 AI 修改回退                                       |
| 只读文件保护         | 对明显系统文件或配置敏感文件默认禁止修改                             |
```

---

## 五、数据流设计

### 5.1 核心数据流图

```text
用户操作
  打开文件 / AI 对话 / 右键选中 / 素材拖拽
        |
        v
    EventBus 事件总线
        |
   ---------------------
   |           |        |
   v           v        v
 filetree    preview   props-panel
   |           |
   v           v
 WebView 实时渲染
        |
   postMessage 元素选中/交互事件
        |
        v
 属性面板更新 / 拓扑图更新
        |
        v
 页面分析引擎
        |
        v
 workflow-topology 渲染
```

### 5.2 关键数据流详解

#### 数据流一：AI 生成网站

```text
1. 用户输入 "做一个个人网站"
2. ai 模块构建上下文：系统提示词 + 用户输入 + 文件结构摘要
3. 渲染进程通过 ipc ai:streamRequest 发送请求
4. 主进程 ai-service 以 SSE 请求 MiMo API
5. 主进程回传 ai:stream-chunk，渲染进程流式更新 UI
6. ai:stream-end 触发响应解析器
7. 提取代码块并校验 path 安全
8. 主进程执行 fs:writeFile，生成/更新项目文件
9. 文件变更触发 preview:refresh，WebView 重新渲染
10. page-analyzer 分析新页面并更新拓扑图
```

#### 数据流二：选中元素修改样式

```text
1. 用户在预览区右键点击按钮
2. WebView 注入脚本捕获 contextmenu，收集 SelectedElement
3. WebView 通过 postMessage 发送到渲染进程
4. preview 模块校验 origin 并发布 element:selected
5. props-panel 显示元素属性
6. 用户调整 font-size：14px -> 18px
7. props-panel 发射 props:property-changed
8. preview 模块先注入临时样式实现实时预览
9. 用户确认后回写 CSS 文件
10. 更新修改历史栈，支持回退
```

#### 数据流三：拓扑图生成

```text
1. 预览区页面刷新完成
2. workflow-topology 请求 page-analyzer:analyze
3. 方案 A（rule）：本地解析 HTML、按语义标签分组、提取交互与 fetch 调用
4. 方案 B（ai）：将 HTML 发给 MiMo，返回模块/关系 JSON
5. 输出 TopologyGraph
6. topology-view 渲染拓扑图
7. 用户点击模块节点
8. 联动预览高亮并更新属性面板
```

---

## 六、关键算法设计

### 6.1 WebView 元素选中

```text
注入脚本逻辑：
1. 监听 contextmenu 事件并 preventDefault
2. 从 event.target 向上寻找最近语义块（section/nav/footer/div[data-id] 等）
3. 采集 tagName、id、className、selector、bbox、computedStyle
4. window.parent.postMessage({ channel: 'livefront', type: 'element:selected', payload }, '*')
5. 绘制 hover overlay，尺寸随元素 bbox 更新

渲染进程接收逻辑：
1. window.addEventListener('message', handler)
2. 校验 message.data.channel === 'livefront'
3. 校验来源 origin，与 preview URL 匹配
4. 解析 payload 并通过 EventBus 分发 element:selected
5. 为高频事件增加防抖，避免 UI 抖动
```

### 6.2 属性面板实时修改

```text
实时注入方案：
1. props-panel 生成临时 CSS 规则：
   .livefront-injected .<selector> { property: value !important; }
2. 通过 WebView postMessage 注入到页面 <style id="livefront-runtime-style">
3. WebView 立即更新，实现 0 刷新预览
4. 用户确认修改后，将变更回写真实 CSS 文件
5. 若目标规则分布在多个文件，优先回写主样式文件并记录映射关系
6. 变更同时写入修改历史栈
```

### 6.3 页面模块分析

```text
方案 B：本地规则引擎（优先实现）
1. 解析 HTML，构建简化 DOM 树
2. 提取可视块级元素并按语义分组
3. 语义映射：
   nav -> 导航模块
   header -> 头部模块
   section -> 内容模块
   form -> 表单模块
   footer -> 页脚模块
4. 识别交互：
   a[href] -> 跳转
   button[onclick] / addEventListener 推断 -> 点击交互
   form[action] -> 提交交互
5. 识别后端连接：
   fetch / axios / XMLHttpRequest / form action -> API 节点
6. 输出 TopologyGraph

方案 A：AI 辅助分析（增强版）
1. 发送 HTML + 脚本摘要到 MiMo
2. 要求输出标准化 JSON：modules + connections
3. 本地校验 JSON schema
4. 与本地规则结果合并去重
```

---

## 七、状态管理

### 7.1 全局状态

```text
LiveFront.State = {
  project: {
    path: string;
    name: string;
    isOpen: boolean;
  },
  preview: {
    isRunning: boolean;
    port: number;
    url: string;
    device: DeviceMode;
  },
  selection: {
    element: SelectedElement | null;
    selector: string;
    tagName: string;
    className: string;
    id: string;
  },
  ai: {
    isStreaming: boolean;
    messages: AiMessage[];
    provider: AiProviderConfig['provider'];
    requestId?: string;
  },
  topology: {
    modules: TopologyModule[];
    connections: TopologyConnection[];
    isAnalyzing: boolean;
    lastAnalyzedAt?: number;
  },
  settings: {
    ui: { theme: 'light' | 'dark'; };
    terminal: { defaultShell: string; };
    preview: { defaultDevice: DeviceMode; portPreference: number; };
    ai: { historySize: number; };
  }
};
```

### 7.2 Storage 持久化

```text
需要持久化的键：
- project.path
- ai.provider
- ai.messages（可选，默认关闭）
- preview.device
- settings.*

持久化策略：
1. 使用 localStorage 作为默认存储层。
2. 写入时增加版本号 `_version`，便于迁移。
3. 首次启动时合并默认值，避免缺失字段异常。
4. 敏感字段（apiKey）不持久化或加密存储，按用户设置决定。
```

---

## 八、错误处理策略

### 8.1 错误分类

```text
| 类别     | 示例                             | 处理方式                               |
|----------|----------------------------------|----------------------------------------|
| 文件错误 | 文件不存在、路径非法、权限不足    | Toast 提示，记录日志，不阻塞主流程     |
| 网络错误 | AI API 失败、预览服务异常         | Toast + 重试入口 + 错误码提示          |
| 渲染错误 | WebView 加载失败                 | 预览区错误占位，支持刷新重试           |
| AI 错误  | 返回格式错误、JSON 解析失败       | 展示原始响应，标注解析失败原因         |
| 端口冲突 | 9527/9528 被占用                 | 自动递增端口并通知用户                 |
| 编码错误 | 非 UTF-8 文件                    | 尝试统一转码并输出警告日志             |
```

### 8.2 健壮性设计

```text
- 所有 IPC 调用默认 10s 超时，支持按频道覆盖。
- 所有异步操作均包裹 try/catch，防止渲染进程白屏。
- WebView 加载 10s 超时，失败后提供重试与外部浏览器打开。
- AI 流式总超时 30s，单项请求可配置。
- 主进程捕获未处理异常，仅记录日志，不弹系统错误窗口。
```

---

## 九、性能优化策略

```text
| 策略                   | 说明                                                                 |
|------------------------|----------------------------------------------------------------------|
| 模块懒加载             | Monaco Editor、素材市场、重型分析能力按需加载，避免启动卡顿          |
| 防抖与节流             | 文件监听、属性修改、AI 输入、拓扑刷新均加防抖                        |
| postMessage 通信       | WebView 通信采用 postMessage，不使用轮询                              |
| 虚拟滚动               | 文件树、素材列表、日志列表大列表场景启用虚拟滚动                      |
| 缓存分析结果           | 页面 HTML 未变化时不重复分析拓扑                                     |
| 最小化预览刷新         | 样式修改优先运行时注入，确认后再写文件并刷新                          |
```

---

*文档版本：v1.0*
*创建日期：2026年7月*
*作者：张家仁（白空）+ AI 辅助设计*
