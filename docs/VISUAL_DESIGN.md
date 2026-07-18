# LiveFront v2.0 视觉设计规范

*版本：v1.0*
*日期：2026年7月*

---

## 一、设计原则

**一句话定义：** LiveFront 是一个暗色、专业、沉浸的 AI 网页编辑器——让代码隐于幕后，让创意浮于眼前。

**三个关键词：**

| 关键词 | 含义 |
|---|---|
| **暗色沉浸** | 深色背景减少视觉干扰，让用户专注于画布和创作内容 |
| **清晰层次** | 通过微妙的明暗差异和边框划分区域，信息层级一目了然 |
| **克制点缀** | 大面积中性色中，用蓝色强调色引导操作焦点，不喧宾夺主 |

---

## 二、颜色系统

### 2.1 CSS 变量定义

```css
:root {
  /* ── 背景色 ── */
  --color-bg-primary:    #0d0d14;   /* 最深背景：应用底色 */
  --color-bg-secondary:  #12121c;   /* 次级背景：侧边栏、面板 */
  --color-bg-tertiary:   #1a1a2e;   /* 三级背景：卡片、输入框 */

  /* ── 表面色 ── */
  --color-surface:       #1e1e32;   /* 表面：弹窗、下拉菜单 */
  --color-surface-hover: #252540;   /* 表面悬停态 */
  --color-surface-active:#2a2a4a;   /* 表面激活态 */

  /* ── 边框色 ── */
  --color-border:        #2a2a3e;   /* 默认边框 */
  --color-border-light:  #3a3a52;   /* 高亮边框（选中、焦点） */
  --color-border-focus:  #4f8ff7;   /* 焦点边框（强调色） */

  /* ── 强调色 ── */
  --color-accent:        #4f8ff7;   /* 主强调色：按钮、链接、选中态 */
  --color-accent-hover:  #6ba3f9;   /* 主强调色悬停态 */
  --color-accent-subtle: #4f8ff720; /* 主强调色低透明度：背景高亮 */
  --color-accent-secondary: #a78bfa; /* 辅助强调色：AI 相关、特殊操作 */

  /* ── 文本色 ── */
  --color-text-primary:  #e8e8ed;   /* 主文本：标题、正文 */
  --color-text-secondary:#9898a8;   /* 次要文本：描述、标签 */
  --color-text-tertiary: #6a6a7a;   /* 暗色文本：占位符、禁用态 */
  --color-text-inverse:  #ffffff;   /* 反色文本：用于深色按钮上 */

  /* ── 语义色 ── */
  --color-success:       #34d399;   /* 成功：操作完成、在线状态 */
  --color-success-bg:    #34d39920; /* 成功背景 */
  --color-warning:       #fbbf24;   /* 警告：注意提示 */
  --color-warning-bg:    #fbbf2420; /* 警告背景 */
  --color-error:         #f87171;   /* 错误：操作失败、危险操作 */
  --color-error-bg:      #f8717120; /* 错误背景 */
}
```

### 2.2 颜色使用场景

| 变量 | 使用场景 |
|---|---|
| `--color-bg-primary` | 应用最底层背景、状态栏背景 |
| `--color-bg-secondary` | 左侧文件树、右侧面板背景 |
| `--color-bg-tertiary` | 输入框背景、卡片背景、代码块背景 |
| `--color-surface` | 弹窗、下拉菜单、上下文菜单背景 |
| `--color-border` | 面板分隔线、卡片边框、Tab 底部线条 |
| `--color-border-focus` | 选中元素高亮框、输入框焦点态 |
| `--color-accent` | 主按钮背景、链接文字、选中态指示器 |
| `--color-accent-secondary` | AI 消息标识、AI 功能按钮 |
| `--color-text-primary` | 页面标题、正文内容、导航文字 |
| `--color-text-secondary` | 文件树文件名、属性标签、状态栏信息 |
| `--color-text-tertiary` | 输入框占位符、禁用按钮文字 |
| `--color-success` | 操作成功 Toast、在线状态指示点 |
| `--color-warning` | 警告 Toast、未保存提示 |
| `--color-error` | 错误 Toast、删除确认按钮 |

---

## 三、字体系统

### 3.1 字体家族

```css
:root {
  --font-sans:  "Inter", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --font-mono:  "JetBrains Mono", "Fira Code", "Consolas", monospace;
}
```

| 字体 | 用途 |
|---|---|
| Inter | 英文正文、UI 文字 |
| PingFang SC | macOS 中文 |
| Microsoft YaHei | Windows 中文 |
| JetBrains Mono | 代码块、文件名、终端 |

### 3.2 字号层级

| 名称 | 变量 | 字号 | 用途 |
|---|---|---|---|
| h1 | `--text-2xl` | 24px | 页面主标题 |
| h2 | `--text-xl` | 20px | 区域标题 |
| h3 | `--text-lg` | 16px | 卡片标题、面板标题 |
| body | `--text-base` | 14px | 正文、菜单项、按钮文字 |
| small | `--text-sm` | 12px | 标签、状态栏、辅助信息 |
| tiny | `--text-xs` | 11px | 角标、极小提示 |

```css
:root {
  --text-2xl:  24px;
  --text-xl:   20px;
  --text-lg:   16px;
  --text-base: 14px;
  --text-sm:   12px;
  --text-xs:   11px;
}
```

### 3.3 行高与字重

```css
:root {
  --leading-tight:  1.25;  /* 标题 */
  --leading-normal: 1.5;   /* 正文 */
  --leading-relaxed: 1.75; /* 大段描述文字 */

  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
}
```

---

## 四、间距系统

基于 **4px** 网格，所有间距为 4 的倍数。

```css
:root {
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   12px;
  --space-lg:   16px;
  --space-xl:   24px;
  --space-2xl:  32px;
  --space-3xl:  48px;
}
```

| 变量 | 值 | 典型用途 |
|---|---|---|
| `--space-xs` | 4px | 图标与文字间距、紧凑元素间距 |
| `--space-sm` | 8px | 按钮内 padding、列表项间距 |
| `--space-md` | 12px | 输入框内 padding、卡片内 padding |
| `--space-lg` | 16px | 面板内 padding、区域间距 |
| `--space-xl` | 24px | 面板之间间距、大区块间距 |
| `--space-2xl` | 32px | 页面级别间距 |
| `--space-3xl` | 48px | 欢迎页大间距 |

---

## 五、圆角系统

```css
:root {
  --radius-sm:   4px;   /* 小组件：标签、小按钮 */
  --radius-md:   6px;   /* 中组件：输入框、卡片、按钮 */
  --radius-lg:   8px;   /* 大组件：弹窗、面板 */
  --radius-full: 9999px; /* 圆形：头像、状态指示点 */
}
```

---

## 六、阴影系统

暗色主题中阴影以半透明黑色为主，辅以微弱的亮色光晕。

```css
:root {
  --shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md:  0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg:  0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 12px rgba(79, 143, 247, 0.15); /* 强调色光晕 */
}
```

| 变量 | 用途 |
|---|---|
| `--shadow-sm` | 按钮、卡片、输入框 |
| `--shadow-md` | 下拉菜单、弹窗 |
| `--shadow-lg` | 模态弹窗、大浮层 |
| `--shadow-glow` | 选中元素高亮、焦点态输入框 |

---

## 七、组件规范

### 7.1 按钮

#### 主按钮（Primary）

```css
.btn-primary {
  height: 36px;
  padding: 0 var(--space-lg);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background 200ms ease;
}
.btn-primary:hover  { background: var(--color-accent-hover); }
.btn-primary:active { background: #3d7de6; transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
```

| 状态 | 背景色 | 文字色 |
|---|---|---|
| 默认 | `#4f8ff7` | `#ffffff` |
| 悬停 | `#6ba3f9` | `#ffffff` |
| 激活 | `#3d7de6` | `#ffffff` |
| 禁用 | `#4f8ff7` 40%透明 | `#ffffff` 40%透明 |

#### 次按钮（Secondary）

```css
.btn-secondary {
  height: 36px;
  padding: 0 var(--space-lg);
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: border-color 200ms ease, background 200ms ease;
}
.btn-secondary:hover  { border-color: var(--color-border-light); background: var(--color-surface-hover); }
.btn-secondary:active { background: var(--color-surface-active); }
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
```

| 状态 | 背景色 | 边框色 | 文字色 |
|---|---|---|---|
| 默认 | 透明 | `#2a2a3e` | `#e8e8ed` |
| 悬停 | `#252540` | `#3a3a52` | `#e8e8ed` |
| 激活 | `#2a2a4a` | `#3a3a52` | `#e8e8ed` |
| 禁用 | 透明 | `#2a2a3e` | `#e8e8ed` 40% |

#### 文字按钮（Text）

```css
.btn-text {
  height: 32px;
  padding: 0 var(--space-sm);
  background: transparent;
  color: var(--color-accent);
  border: none;
  font-size: var(--text-base);
  cursor: pointer;
  transition: color 200ms ease;
}
.btn-text:hover  { color: var(--color-accent-hover); }
.btn-text:active { color: #3d7de6; }
```

#### 图标按钮（Icon）

```css
.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 200ms ease, background 200ms ease;
}
.btn-icon:hover  { color: var(--color-text-primary); background: var(--color-surface-hover); }
.btn-icon:active { background: var(--color-surface-active); }
```

### 7.2 输入框

```css
.input {
  height: 36px;
  padding: 0 var(--space-md);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.input::placeholder { color: var(--color-text-tertiary); }
.input:hover        { border-color: var(--color-border-light); }
.input:focus        { border-color: var(--color-border-focus); box-shadow: var(--shadow-glow); outline: none; }
.input:disabled     { opacity: 0.4; cursor: not-allowed; }
```

| 状态 | 背景色 | 边框色 | 阴影 |
|---|---|---|---|
| 默认 | `#1a1a2e` | `#2a2a3e` | 无 |
| 悬停 | `#1a1a2e` | `#3a3a52` | 无 |
| 焦点 | `#1a1a2e` | `#4f8ff7` | `0 0 12px rgba(79,143,247,0.15)` |
| 禁用 | `#1a1a2e` | `#2a2a3e` | 无 |

### 7.3 Tab 栏

```css
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
}
.tab-item {
  height: 40px;
  padding: 0 var(--space-lg);
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-bottom: 2px solid transparent;
  font-size: var(--text-base);
  cursor: pointer;
  transition: color 200ms ease, border-color 200ms ease;
}
.tab-item:hover       { color: var(--color-text-primary); }
.tab-item.active      { color: var(--color-accent); border-bottom-color: var(--color-accent); }
```

| 状态 | 文字色 | 底部线条 |
|---|---|---|
| 默认 | `#9898a8` | 透明 |
| 悬停 | `#e8e8ed` | 透明 |
| 激活 | `#4f8ff7` | `#4f8ff7` 2px |

### 7.4 滑块

```css
.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 150ms ease;
}
.slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
```

| 部件 | 颜色 | 尺寸 |
|---|---|---|
| 轨道 | `#2a2a3e` | 高 4px |
| 滑块 | `#4f8ff7` | 14×14px 圆形 |
| 滑块悬停 | `#6ba3f9` | 放大 1.2 倍 |

### 7.5 色板选择器

```css
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition: border-color 200ms ease, transform 150ms ease;
}
.color-swatch:hover { border-color: var(--color-border-light); transform: scale(1.1); }
```

点击后弹出颜色选择器弹窗，尺寸 240×280px，圆角 `--radius-lg`。

### 7.6 卡片

```css
.card {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.card:hover { border-color: var(--color-border-light); box-shadow: var(--shadow-sm); }
```

### 7.7 Toast 提示

```css
.toast {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  z-index: 1000;
  animation: slideIn 300ms ease;
}
.toast-success { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success); }
.toast-warning { background: var(--color-warning-bg); color: var(--color-warning); border: 1px solid var(--color-warning); }
.toast-error   { background: var(--color-error-bg);   color: var(--color-error);   border: 1px solid var(--color-error); }
```

| 类型 | 背景色 | 文字色 | 边框色 |
|---|---|---|---|
| 成功 | `#34d399` 12% | `#34d399` | `#34d399` |
| 警告 | `#fbbf24` 12% | `#fbbf24` | `#fbbf24` |
| 错误 | `#f87171` 12% | `#f87171` | `#f87171` |

### 7.8 上下文菜单

```css
.context-menu {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xs) 0;
  box-shadow: var(--shadow-md);
  min-width: 180px;
}
.context-menu-item {
  height: 32px;
  padding: 0 var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  cursor: pointer;
  transition: background 100ms ease;
}
.context-menu-item:hover    { background: var(--color-surface-hover); }
.context-menu-item:active   { background: var(--color-surface-active); }
.context-menu-item.danger   { color: var(--color-error); }
.context-menu-separator     { height: 1px; background: var(--color-border); margin: var(--space-xs) 0; }
```

### 7.9 工具栏 / 顶部栏

```css
.toolbar {
  height: 40px;
  padding: 0 var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}
```

| 属性 | 值 |
|---|---|
| 高度 | 40px |
| 背景色 | `#12121c` |
| 底部边框 | `1px solid #2a2a3e` |
| 内边距 | 水平 12px |
| 元素间距 | 8px |

### 7.10 节点卡片（Node Card）

拓扑图中使用的 ComfyUI 风格模块卡片。

```css
.node-card {
  width: 240px;
  min-height: 140px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: grab;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.node-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-glow);
}
.node-card-header {
  padding: var(--space-sm) var(--space-md);
  display: flex; align-items: center; gap: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
  font-size: 13px; font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}
.node-card-body {
  padding: var(--space-sm) var(--space-md);
  font-size: 11px; line-height: 1.6;
  color: var(--color-text-secondary);
}
.node-card-body .field { margin-bottom: 2px; }
.node-card-body .field-label { color: var(--color-text-tertiary); }
.node-card-footer {
  padding: var(--space-xs) var(--space-md);
  border-top: 1px solid var(--color-border);
  font-size: 10px; color: var(--color-text-tertiary);
  display: flex; align-items: center; gap: var(--space-sm);
}
.node-card-footer .status-dot {
  width: 6px; height: 6px; border-radius: var(--radius-full);
  background: var(--color-success);
}
```

| 属性 | 值 |
|---|---|
| 最小尺寸 | 240px × 140px |
| 背景色 | `var(--color-surface)`（#1e1e32） |
| 边框 | 1px solid `var(--color-border)`（#2a2a3e） |
| 圆角 | `var(--radius-md)`（6px） |
| 标题行 | 字号 13px，字重 600，左侧带类型图标 |
| 内容区 | 字号 11-12px，行高 1.6，颜色 `var(--color-text-secondary)` |
| 分隔线 | 1px solid `var(--color-border)`，间距 8px |
| 状态行 | 字号 10px，颜色 `var(--color-text-tertiary)` |
| hover 态 | 边框变为 `var(--color-accent)`，添加 `box-shadow: var(--shadow-glow)` |
| 拖拽态 | cursor: grabbing，添加阴影 |

### 7.11 连接线（Connection Line）

拓扑图中模块之间的 SVG 连接线。

```css
.connection-line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
}
.connection-flow {
  stroke: #4fc3f7;           /* 蓝色：页面流向 */
  stroke-dasharray: none;
}
.connection-interaction {
  stroke: #ffb74d;           /* 橙色：交互跳转 */
  stroke-dasharray: 8 4;
}
.connection-backend {
  stroke: #81c784;           /* 绿色：后端连接 */
  stroke-dasharray: 4 4;
}
.connection-dependency {
  stroke: #4a4a5e;           /* 灰色：依赖关系 */
  stroke-dasharray: none;
  stroke-width: 1;
}
```

| 属性 | 值 |
|---|---|
| 线条宽度 | 2px（依赖关系 1px） |
| 箭头大小 | 8px |
| 贝塞尔曲线 | 控制点自动计算（水平偏移 50%） |
| 页面流向 | 颜色 `#4fc3f7`，实线 |
| 交互跳转 | 颜色 `#ffb74d`，虚线（`stroke-dasharray: 8 4`） |
| 后端连接 | 颜色 `#81c784`，点线（`stroke-dasharray: 4 4`） |
| 依赖关系 | 颜色 `#4a4a5e`，细实线（1px） |


---

## 八、图标规范

### 8.1 图标风格

采用 **线条图标（Outlined）** 风格，线条粗细 **1.5px**，与暗色背景形成清晰对比又不过于突兀。

### 8.2 图标尺寸

| 名称 | 尺寸 | 用途 |
|---|---|---|
| 小图标 | 16px | 文件树、菜单项、内联图标 |
| 中图标 | 20px | 工具栏按钮、Tab 图标 |
| 大图标 | 24px | 欢迎页按钮、空状态插图 |

### 8.3 图标颜色规则

| 场景 | 颜色 |
|---|---|
| 默认 | `--color-text-secondary`（#9898a8） |
| 悬停 | `--color-text-primary`（#e8e8ed） |
| 激活/选中 | `--color-accent`（#4f8ff7） |
| 禁用 | `--color-text-tertiary`（#6a6a7a） |

---

## 九、动画规范

### 9.1 过渡时长

```css
:root {
  --duration-fast:   100ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
}
```

### 9.2 缓动函数

```css
:root {
  --ease-default:  ease-in-out;
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性回弹 */
  --ease-smooth:   cubic-bezier(0.25, 0.1, 0.25, 1);  /* 平滑过渡 */
}
```

### 9.3 动画应用

| 元素 | 动画 | 时长 | 缓动 |
|---|---|---|---|
| 按钮背景色 | 颜色过渡 | fast (100ms) | ease-in-out |
| 输入框边框 | 颜色过渡 | normal (200ms) | ease-in-out |
| Tab 切换下划线 | 位移 + 颜色 | normal (200ms) | ease-in-out |
| 弹窗/菜单出现 | 透明度 + 缩放 | slow (300ms) | spring |
| Toast 滑入 | 从右滑入 | slow (300ms) | smooth |
| 面板折叠 | 宽度过渡 | normal (200ms) | ease-in-out |
| 选中高亮框 | 边框颜色过渡 | fast (100ms) | ease-in-out |
| 拓扑图节点 | 透明度淡入 | normal (200ms) | ease-in-out |

---

*文档版本：v1.0*
*创建日期：2026年7月*

