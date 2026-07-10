/* LiveFront 素材库 - 静态素材数据 */
(function () {
  window.LiveFront = window.LiveFront || {};

  LiveFront.MaterialsData = [
    // ========== 字体素材 (8个) ==========
    {
      id: 'source-han-sans', name: '思源黑体', category: '字体', subcategory: '黑体',
      tags: ['中文', '黑体', '开源', 'Google Fonts', '无衬线'],
      description: 'Adobe 与 Google 联合推出的开源中文黑体，支持简繁中文、日文、韩文。',
      free: true, previewType: 'text',
      fontFamily: '"Noto Sans SC", sans-serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap',
      code: {
        css: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');\n\n.custom-font {\n  font-family: 'Noto Sans SC', sans-serif;\n}\n\n/* 标题 */\n.heading { font-weight: 700; }\n/* 正文 */\n.body-text { font-weight: 400; }"
      }
    },
    {
      id: 'source-han-serif', name: '思源宋体', category: '字体', subcategory: '宋体',
      tags: ['中文', '宋体', '衬线', '开源', 'Google Fonts'],
      description: 'Adobe 与 Google 联合推出的开源中文宋体，适合长文阅读和传统排版。',
      free: true, previewType: 'text',
      fontFamily: '"Noto Serif SC", serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap',
      code: {
        css: "@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');\n\n.custom-font {\n  font-family: 'Noto Serif SC', serif;\n}\n\n.heading { font-weight: 700; }\n.body-text { font-weight: 400; }"
      }
    },
    {
      id: 'alibaba-puhuiti', name: '阿里巴巴普惠体', category: '字体', subcategory: '黑体',
      tags: ['中文', '黑体', '免费商用', '阿里巴巴'],
      description: '阿里巴巴推出的免费商用中文字体，字形优美，适合各类设计场景。',
      free: true, previewType: 'text',
      fontFamily: '"Alibaba PuHuiTi 2.0", sans-serif',
      code: {
        css: "/* 阿里巴巴普惠体需要下载使用 */\n/* 下载地址: https://fonts.alibabagroup.com/ */\n\n@font-face {\n  font-family: 'Alibaba PuHuiTi 2.0';\n  src: url('./fonts/Alibaba-PuHuiTi-2.0-Regular.woff2') format('woff2');\n  font-weight: 400;\n  font-style: normal;\n  font-display: swap;\n}\n\n.custom-font {\n  font-family: 'Alibaba PuHuiTi 2.0', sans-serif;\n}"
      }
    },
    {
      id: 'lxgw-wenkai', name: '霞鹜文楷', category: '字体', subcategory: '楷体',
      tags: ['中文', '楷体', '开源', '手写风格'],
      description: '基于 FONTWORKS Klee One 改造的开源中文楷体，风格清新文艺。',
      free: true, previewType: 'text',
      fontFamily: '"LXGW WenKai", cursive',
      importUrl: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai:wght@400;700&display=swap',
      code: {
        css: "@import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai:wght@400;700&display=swap');\n\n.custom-font {\n  font-family: 'LXGW WenKai', cursive;\n}\n\n.heading { font-weight: 700; }\n.body-text { font-weight: 400; }"
      }
    },
    {
      id: 'inter', name: 'Inter', category: '字体', subcategory: '无衬线',
      tags: ['英文', '无衬线', 'UI', '开源'],
      description: '专为 UI 设计的开源英文字体，可变字重，清晰易读。',
      free: true, previewType: 'text',
      fontFamily: '"Inter", sans-serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      code: {
        css: "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');\n\n.custom-font {\n  font-family: 'Inter', sans-serif;\n  font-feature-settings: 'cv11', 'ss01';\n}\n\n.heading { font-weight: 700; }\n.body-text { font-weight: 400; }"
      }
    },
    {
      id: 'playfair', name: 'Playfair Display', category: '字体', subcategory: '衬线',
      tags: ['英文', '衬线', '优雅', '标题'],
      description: '优雅的英文衬线字体，适合标题、品牌名和正式场合使用。',
      free: true, previewType: 'text',
      fontFamily: '"Playfair Display", serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap',
      code: {
        css: "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');\n\n.custom-font {\n  font-family: 'Playfair Display', serif;\n}\n\n.heading {\n  font-weight: 900;\n  letter-spacing: -0.02em;\n}"
      }
    },
    {
      id: 'bebas-neue', name: 'Bebas Neue', category: '字体', subcategory: '标题',
      tags: ['英文', '标题', '大字', '海报'],
      description: '窄体无衬线字体，适合大标题、海报和数字展示。',
      free: true, previewType: 'text',
      fontFamily: '"Bebas Neue", sans-serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
      code: {
        css: "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');\n\n.custom-font {\n  font-family: 'Bebas Neue', sans-serif;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n}\n\n.heading {\n  font-size: 3rem;\n  line-height: 1.1;\n}"
      }
    },
    {
      id: 'jetbrains-mono', name: 'JetBrains Mono', category: '字体', subcategory: '等宽',
      tags: ['英文', '等宽', '代码', '开发'],
      description: 'JetBrains 推出的等宽字体，专为代码编写优化，支持连字。',
      free: true, previewType: 'text',
      fontFamily: '"JetBrains Mono", monospace',
      importUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
      code: {
        css: "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');\n\n.custom-font {\n  font-family: 'JetBrains Mono', monospace;\n  font-feature-settings: 'calt', 'liga';\n}\n\ncode, pre {\n  font-family: 'JetBrains Mono', monospace;\n  font-size: 14px;\n  line-height: 1.6;\n}"
      }
    },

    // ========== 图标素材 (4个) ==========
    {
      id: 'lucide', name: 'Lucide Icons', category: '图标', subcategory: '线性图标',
      tags: ['SVG', '图标', '开源', '线性', 'Lucide'],
      description: '2000+ 开源 SVG 图标，Feather Icons 的延续，支持 tree-shaking。',
      free: true, previewType: 'code-block',
      code: {
        html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
        css: "/* Lucide Icons 使用方式 */\n/* npm install lucide */\n\n.icon {\n  width: 24px;\n  height: 24px;\n  stroke: currentColor;\n  fill: none;\n  stroke-width: 2;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}"
      }
    },
    {
      id: 'phosphor', name: 'Phosphor Icons', category: '图标', subcategory: '多风格图标',
      tags: ['SVG', '图标', '开源', '多风格'],
      description: '6000+ 图标，支持 6 种粗细风格，适合各类 UI 设计。',
      free: true, previewType: 'code-block',
      code: {
        html: '<svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor"><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-width="16"/></svg>',
        css: "/* Phosphor Icons 使用方式 */\n/* npm install phosphor-icons */\n\n.ph-icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n}"
      }
    },
    {
      id: 'feather', name: 'Feather Icons', category: '图标', subcategory: '线性图标',
      tags: ['SVG', '图标', '开源', '简约'],
      description: '简洁优美的线性 SVG 图标集，280+ 个常用图标。',
      free: true, previewType: 'code-block',
      code: {
        html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        css: "/* Feather Icons 使用方式 */\n/* npm install feather-icons */\n\n.feather-icon {\n  width: 24px;\n  height: 24px;\n  stroke: currentColor;\n  fill: none;\n  stroke-width: 2;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}"
      }
    },
    {
      id: 'heroicons', name: 'Heroicons', category: '图标', subcategory: 'Tailwind 风格',
      tags: ['SVG', '图标', 'Tailwind', '开源'],
      description: '由 Tailwind CSS 团队打造的图标集，支持 Outline、Solid、Mini 三种风格。',
      free: true, previewType: 'code-block',
      code: {
        html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>',
        css: "/* Heroicons 使用方式 */\n/* npm install heroicons */\n/* 或从 https://heroicons.com 下载 SVG */\n\n.hero-icon {\n  width: 24px;\n  height: 24px;\n  color: currentColor;\n}"
      }
    },

    // ========== 配色素材 (6个) ==========
    {
      id: 'tailwind-palette', name: 'Tailwind CSS 色板', category: '配色', subcategory: '基础色板',
      tags: ['Tailwind', '色板', 'CSS 变量', '配色'],
      description: 'Tailwind CSS 官方色板，从 50 到 950 共 22 个色阶。',
      free: true, previewType: 'color-swatch',
      code: {
        variables: {
          '--color-primary-50': '#eff6ff', '--color-primary-100': '#dbeafe',
          '--color-primary-200': '#bfdbfe', '--color-primary-300': '#93c5fd',
          '--color-primary-400': '#60a5fa', '--color-primary-500': '#3b82f6',
          '--color-primary-600': '#2563eb', '--color-primary-700': '#1d4ed8',
          '--color-primary-800': '#1e40af', '--color-primary-900': '#1e3a8a',
          '--color-primary-950': '#172554'
        },
        css: ":root {\n  --color-primary-50: #eff6ff;\n  --color-primary-100: #dbeafe;\n  --color-primary-200: #bfdbfe;\n  --color-primary-300: #93c5fd;\n  --color-primary-400: #60a5fa;\n  --color-primary-500: #3b82f6;\n  --color-primary-600: #2563eb;\n  --color-primary-700: #1d4ed8;\n  --color-primary-800: #1e40af;\n  --color-primary-900: #1e3a8a;\n  --color-primary-950: #172554;\n  --color-success: #22c55e;\n  --color-warning: #f59e0b;\n  --color-error: #ef4444;\n  --color-info: #3b82f6;\n}"
      }
    },
    {
      id: 'ocean-breeze', name: '海洋清风配色', category: '配色', subcategory: '蓝色系',
      tags: ['蓝色', '海洋', '清新', '配色'],
      description: '清新的海洋蓝配色方案，适合科技、健康、金融类项目。',
      free: true, previewType: 'color-swatch',
      code: {
        variables: {
          '--color-primary': '#0ea5e9', '--color-primary-light': '#38bdf8',
          '--color-primary-dark': '#0284c7', '--color-secondary': '#06b6d4',
          '--color-accent': '#22d3ee', '--color-bg': '#f0f9ff',
          '--color-surface': '#ffffff', '--color-text': '#0c4a6e',
          '--color-text-secondary': '#64748b'
        },
        css: ":root {\n  --color-primary: #0ea5e9;\n  --color-primary-light: #38bdf8;\n  --color-primary-dark: #0284c7;\n  --color-secondary: #06b6d4;\n  --color-accent: #22d3ee;\n  --color-bg: #f0f9ff;\n  --color-surface: #ffffff;\n  --color-text: #0c4a6e;\n  --color-text-secondary: #64748b;\n  --color-border: #bae6fd;\n  --color-shadow: rgba(14, 165, 233, 0.1);\n}"
      }
    },
    {
      id: 'sunset-glow', name: '日落配色', category: '配色', subcategory: '暖色系',
      tags: ['暖色', '日落', '橙色', '配色'],
      description: '温暖的日落配色方案，适合创意、餐饮、旅游类项目。',
      free: true, previewType: 'color-swatch',
      code: {
        variables: {
          '--color-primary': '#f97316', '--color-primary-light': '#fb923c',
          '--color-primary-dark': '#ea580c', '--color-secondary': '#f59e0b',
          '--color-accent': '#ef4444', '--color-bg': '#fffbeb',
          '--color-surface': '#ffffff', '--color-text': '#451a03',
          '--color-text-secondary': '#78716c'
        },
        css: ":root {\n  --color-primary: #f97316;\n  --color-primary-light: #fb923c;\n  --color-primary-dark: #ea580c;\n  --color-secondary: #f59e0b;\n  --color-accent: #ef4444;\n  --color-bg: #fffbeb;\n  --color-surface: #ffffff;\n  --color-text: #451a03;\n  --color-text-secondary: #78716c;\n  --color-border: #fed7aa;\n  --color-shadow: rgba(249, 115, 22, 0.1);\n}"
      }
    },
    {
      id: 'forest-deep', name: '深林配色', category: '配色', subcategory: '绿色系',
      tags: ['绿色', '森林', '自然', '配色'],
      description: '深邃的森林绿配色方案，适合环保、健康、自然类项目。',
      free: true, previewType: 'color-swatch',
      code: {
        variables: {
          '--color-primary': '#16a34a', '--color-primary-light': '#22c55e',
          '--color-primary-dark': '#15803d', '--color-secondary': '#0d9488',
          '--color-accent': '#84cc16', '--color-bg': '#f0fdf4',
          '--color-surface': '#ffffff', '--color-text': '#14532d',
          '--color-text-secondary': '#6b7280'
        },
        css: ":root {\n  --color-primary: #16a34a;\n  --color-primary-light: #22c55e;\n  --color-primary-dark: #15803d;\n  --color-secondary: #0d9488;\n  --color-accent: #84cc16;\n  --color-bg: #f0fdf4;\n  --color-surface: #ffffff;\n  --color-text: #14532d;\n  --color-text-secondary: #6b7280;\n  --color-border: #bbf7d0;\n  --color-shadow: rgba(22, 163, 74, 0.1);\n}"
      }
    },
    {
      id: 'dark-mode', name: '暗色主题配色', category: '配色', subcategory: '暗色系',
      tags: ['暗色', '深色', '专业', '配色'],
      description: '专业的暗色主题配色方案，护眼且适合开发工具和专业应用。',
      free: true, previewType: 'color-swatch',
      code: {
        variables: {
          '--color-primary': '#6366f1', '--color-primary-light': '#818cf8',
          '--color-primary-dark': '#4f46e5', '--color-secondary': '#a78bfa',
          '--color-accent': '#22d3ee', '--color-bg': '#0f172a',
          '--color-surface': '#1e293b', '--color-text': '#f1f5f9',
          '--color-text-secondary': '#94a3b8'
        },
        css: ":root {\n  --color-primary: #6366f1;\n  --color-primary-light: #818cf8;\n  --color-primary-dark: #4f46e5;\n  --color-secondary: #a78bfa;\n  --color-accent: #22d3ee;\n  --color-bg: #0f172a;\n  --color-surface: #1e293b;\n  --color-text: #f1f5f9;\n  --color-text-secondary: #94a3b8;\n  --color-border: #334155;\n  --color-shadow: rgba(0, 0, 0, 0.3);\n  --color-hover: #334155;\n}"
      }
    },
    {
      id: 'gradient-200', name: '渐变色预设集', category: '配色', subcategory: '渐变色',
      tags: ['渐变', '背景', '时尚', '配色'],
      description: '精选渐变色预设，可直接用于背景和按钮。',
      free: true, previewType: 'color-swatch',
      code: {
        css: "/* 精选渐变色预设 */\n\n/* 日落橙 */\n.gradient-sunset {\n  background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6);\n}\n\n/* 海洋蓝 */\n.gradient-ocean {\n  background: linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981);\n}\n\n/* 极光 */\n.gradient-aurora {\n  background: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa, #c084fc);\n}\n\n/* 翡翠 */\n.gradient-emerald {\n  background: linear-gradient(135deg, #10b981, #059669, #047857);\n}\n\n/* 薰衣草 */\n.gradient-lavender {\n  background: linear-gradient(135deg, #a78bfa, #818cf8, #6366f1);\n}\n\n/* 火焰 */\n.gradient-fire {\n  background: linear-gradient(135deg, #ef4444, #f97316, #f59e0b);\n}"
      }
    },

    // ========== 组件模板 (8个) ==========
    {
      id: 'navbar-fixed', name: '固定顶部导航栏', category: '组件', subcategory: '导航栏',
      tags: ['导航栏', '固定', '顶部', '组件'],
      description: '固定在页面顶部的导航栏，支持 Logo、菜单和操作按钮。',
      free: true, previewType: 'code-block',
      code: {
        html: '<nav class="navbar-fixed">\n  <div class="navbar-container">\n    <a href="#" class="navbar-logo">Brand</a>\n    <div class="navbar-menu">\n      <a href="#" class="navbar-link active">首页</a>\n      <a href="#" class="navbar-link">产品</a>\n      <a href="#" class="navbar-link">关于</a>\n      <a href="#" class="navbar-link">联系我们</a>\n    </div>\n    <div class="navbar-actions">\n      <button class="btn btn-ghost">登录</button>\n      <button class="btn btn-primary">免费试用</button>\n    </div>\n  </div>\n</nav>',
        css: ".navbar-fixed {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 64px;\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(10px);\n  border-bottom: 1px solid rgba(0, 0, 0, 0.1);\n  z-index: 1000;\n  display: flex;\n  align-items: center;\n}\n\n.navbar-container {\n  width: 100%;\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 24px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.navbar-logo {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 18px;\n  font-weight: 700;\n  color: #1e293b;\n  text-decoration: none;\n}\n\n.navbar-menu {\n  display: flex;\n  gap: 32px;\n}\n\n.navbar-link {\n  font-size: 14px;\n  color: #64748b;\n  text-decoration: none;\n  transition: color 0.2s;\n}\n\n.navbar-link:hover,\n.navbar-link.active {\n  color: #1e293b;\n}\n\n.navbar-actions {\n  display: flex;\n  gap: 12px;\n}\n\n.btn {\n  padding: 8px 16px;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n\n.btn-ghost {\n  background: transparent;\n  border: 1px solid #e2e8f0;\n  color: #64748b;\n}\n\n.btn-ghost:hover {\n  background: #f8fafc;\n}\n\n.btn-primary {\n  background: #3b82f6;\n  border: none;\n  color: white;\n}\n\n.btn-primary:hover {\n  background: #2563eb;\n}"
      }
    },
    {
      id: 'navbar-transparent', name: '透明滚动导航', category: '组件', subcategory: '导航栏',
      tags: ['导航栏', '透明', '滚动', '组件'],
      description: '透明背景导航栏，滚动后变为实色背景，适合英雄区页面。',
      free: true, previewType: 'code-block',
      code: {
        html: '<nav class="navbar-transparent" id="navbarTransparent">\n  <div class="navbar-container">\n    <a href="#" class="navbar-logo">Brand</a>\n    <div class="navbar-menu">\n      <a href="#" class="navbar-link">首页</a>\n      <a href="#" class="navbar-link">特性</a>\n      <a href="#" class="navbar-link">定价</a>\n      <a href="#" class="navbar-link">博客</a>\n    </div>\n    <button class="btn btn-primary">开始使用</button>\n  </div>\n</nav>',
        css: ".navbar-transparent {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 72px;\n  background: transparent;\n  z-index: 1000;\n  transition: all 0.3s ease;\n  display: flex;\n  align-items: center;\n}\n\n.navbar-transparent.scrolled {\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(10px);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n}\n\n.navbar-transparent .navbar-logo {\n  color: white;\n  font-size: 20px;\n  font-weight: 700;\n  text-decoration: none;\n}\n\n.navbar-transparent.scrolled .navbar-logo {\n  color: #1e293b;\n}\n\n.navbar-transparent .navbar-link {\n  color: rgba(255, 255, 255, 0.9);\n  text-decoration: none;\n  font-size: 14px;\n  transition: color 0.2s;\n}\n\n.navbar-transparent.scrolled .navbar-link {\n  color: #64748b;\n}",
        js: "// 滚动时切换导航栏样式\nwindow.addEventListener('scroll', () => {\n  const navbar = document.getElementById('navbarTransparent');\n  if (window.scrollY > 50) {\n    navbar.classList.add('scrolled');\n  } else {\n    navbar.classList.remove('scrolled');\n  }\n});"
      }
    },
    {
      id: 'hero-centered', name: '居中英雄区', category: '组件', subcategory: '英雄区',
      tags: ['英雄区', '居中', '首屏', '组件'],
      description: '居中布局的英雄区组件，适合产品着陆页首屏展示。',
      free: true, previewType: 'code-block',
      code: {
        html: '<section class="hero-centered">\n  <div class="hero-content">\n    <span class="hero-badge">🚀 新功能发布</span>\n    <h1 class="hero-title">构建下一代<br>Web 应用</h1>\n    <p class="hero-desc">使用我们的工具，快速构建美观、响应式的网站和应用。无需复杂配置，开箱即用。</p>\n    <div class="hero-actions">\n      <button class="btn btn-primary btn-lg">免费开始</button>\n      <button class="btn btn-ghost btn-lg">查看演示</button>\n    </div>\n    <div class="hero-stats">\n      <div class="stat"><span class="stat-value">10K+</span><span class="stat-label">用户</span></div>\n      <div class="stat"><span class="stat-value">99.9%</span><span class="stat-label">可用性</span></div>\n      <div class="stat"><span class="stat-value">50+</span><span class="stat-label">组件</span></div>\n    </div>\n  </div>\n</section>',
        css: ".hero-centered {\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  text-align: center;\n  padding: 80px 24px;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}\n\n.hero-content {\n  max-width: 640px;\n}\n\n.hero-badge {\n  display: inline-block;\n  padding: 6px 16px;\n  background: rgba(255, 255, 255, 0.2);\n  border-radius: 50px;\n  font-size: 14px;\n  margin-bottom: 24px;\n}\n\n.hero-title {\n  font-size: 48px;\n  font-weight: 800;\n  line-height: 1.2;\n  margin-bottom: 20px;\n}\n\n.hero-desc {\n  font-size: 18px;\n  line-height: 1.6;\n  opacity: 0.9;\n  margin-bottom: 32px;\n}\n\n.hero-actions {\n  display: flex;\n  gap: 16px;\n  justify-content: center;\n  margin-bottom: 48px;\n}\n\n.btn-lg {\n  padding: 14px 32px;\n  font-size: 16px;\n  border-radius: 10px;\n}\n\n.btn-primary {\n  background: white;\n  color: #667eea;\n  border: none;\n  font-weight: 600;\n  cursor: pointer;\n}\n\n.btn-ghost {\n  background: transparent;\n  border: 2px solid rgba(255, 255, 255, 0.5);\n  color: white;\n  cursor: pointer;\n}\n\n.hero-stats {\n  display: flex;\n  gap: 48px;\n  justify-content: center;\n}\n\n.stat {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.stat-value {\n  font-size: 24px;\n  font-weight: 700;\n}\n\n.stat-label {\n  font-size: 14px;\n  opacity: 0.8;\n}"
      }
    },
    {
      id: 'hero-split', name: '左文右图英雄区', category: '组件', subcategory: '英雄区',
      tags: ['英雄区', '图文', '左右布局', '组件'],
      description: '左侧文字、右侧图片的英雄区布局，适合产品展示。',
      free: true, previewType: 'code-block',
      code: {
        html: '<section class="hero-split">\n  <div class="hero-container">\n    <div class="hero-text">\n      <span class="hero-badge">✨ 全新升级</span>\n      <h1 class="hero-title">让你的设计<br>栩栩如生</h1>\n      <p class="hero-desc">强大的设计工具，帮助你快速实现创意想法。支持实时预览、组件库和一键部署。</p>\n      <div class="hero-actions">\n        <button class="btn btn-primary">开始创作</button>\n        <button class="btn btn-outline">了解更多</button>\n      </div>\n    </div>\n    <div class="hero-image">\n      <div class="hero-placeholder">Image</div>\n    </div>\n  </div>\n</section>',
        css: ".hero-split {\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  padding: 80px 24px;\n  background: #f8fafc;\n}\n\n.hero-container {\n  max-width: 1200px;\n  margin: 0 auto;\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 64px;\n  align-items: center;\n}\n\n.hero-badge {\n  display: inline-block;\n  padding: 6px 16px;\n  background: #eff6ff;\n  color: #3b82f6;\n  border-radius: 50px;\n  font-size: 14px;\n  font-weight: 500;\n  margin-bottom: 20px;\n}\n\n.hero-title {\n  font-size: 42px;\n  font-weight: 800;\n  line-height: 1.2;\n  color: #1e293b;\n  margin-bottom: 16px;\n}\n\n.hero-desc {\n  font-size: 16px;\n  line-height: 1.7;\n  color: #64748b;\n  margin-bottom: 28px;\n}\n\n.hero-actions {\n  display: flex;\n  gap: 12px;\n}\n\n.btn {\n  padding: 12px 24px;\n  border-radius: 8px;\n  font-size: 15px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n\n.btn-primary {\n  background: #3b82f6;\n  color: white;\n  border: none;\n}\n\n.btn-primary:hover {\n  background: #2563eb;\n}\n\n.btn-outline {\n  background: white;\n  color: #3b82f6;\n  border: 1px solid #3b82f6;\n}\n\n.hero-placeholder {\n  width: 100%;\n  aspect-ratio: 4/3;\n  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);\n  border-radius: 16px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #0ea5e9;\n  font-size: 24px;\n}"
      }
    },
    {
      id: 'card-product', name: '产品卡片', category: '组件', subcategory: '卡片',
      tags: ['卡片', '产品', '电商', '组件'],
      description: '产品展示卡片，包含图片、标题、价格和购买按钮。',
      free: true, previewType: 'code-block',
      code: {
        html: '<div class="product-card">\n  <div class="product-image">\n    <div class="product-placeholder">📦</div>\n    <span class="product-badge">新品</span>\n  </div>\n  <div class="product-info">\n    <h3 class="product-name">产品名称</h3>\n    <p class="product-desc">简短的产品描述文字，介绍产品特点。</p>\n    <div class="product-footer">\n      <span class="product-price">¥299</span>\n      <button class="btn btn-primary btn-sm">加入购物车</button>\n    </div>\n  </div>\n</div>',
        css: ".product-card {\n  width: 280px;\n  background: white;\n  border-radius: 12px;\n  overflow: hidden;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n  transition: all 0.2s;\n}\n\n.product-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);\n}\n\n.product-image {\n  position: relative;\n  aspect-ratio: 4/3;\n  background: #f1f5f9;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 48px;\n}\n\n.product-badge {\n  position: absolute;\n  top: 12px;\n  left: 12px;\n  padding: 4px 10px;\n  background: #ef4444;\n  color: white;\n  font-size: 12px;\n  font-weight: 500;\n  border-radius: 6px;\n}\n\n.product-info {\n  padding: 16px;\n}\n\n.product-name {\n  font-size: 16px;\n  font-weight: 600;\n  color: #1e293b;\n  margin-bottom: 8px;\n}\n\n.product-desc {\n  font-size: 13px;\n  color: #64748b;\n  line-height: 1.5;\n  margin-bottom: 12px;\n}\n\n.product-footer {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n.product-price {\n  font-size: 20px;\n  font-weight: 700;\n  color: #ef4444;\n}\n\n.btn-sm {\n  padding: 8px 16px;\n  font-size: 13px;\n  border-radius: 6px;\n}\n\n.btn-primary {\n  background: #3b82f6;\n  color: white;\n  border: none;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n\n.btn-primary:hover {\n  background: #2563eb;\n}"
      }
    },
    {
      id: 'card-blog', name: '博客卡片', category: '组件', subcategory: '卡片',
      tags: ['卡片', '博客', '文章', '组件'],
      description: '博客文章卡片，包含封面图、标题、摘要和作者信息。',
      free: true, previewType: 'code-block',
      code: {
        html: '<article class="blog-card">\n  <div class="blog-image">📝</div>\n  <div class="blog-content">\n    <div class="blog-meta">\n      <span class="blog-category">技术</span>\n      <span class="blog-date">2024-01-15</span>\n    </div>\n    <h3 class="blog-title">文章标题示例</h3>\n    <p class="blog-excerpt">这是一段文章摘要文字，描述文章的主要内容，吸引读者点击阅读...</p>\n    <div class="blog-footer">\n      <div class="blog-author">\n        <div class="blog-avatar"></div>\n        <span>作者名称</span>\n      </div>\n      <span class="blog-read-more">阅读全文 →</span>\n    </div>\n  </div>\n</article>',
        css: ".blog-card {\n  width: 320px;\n  background: white;\n  border-radius: 12px;\n  overflow: hidden;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);\n  transition: all 0.2s;\n}\n\n.blog-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);\n}\n\n.blog-image {\n  aspect-ratio: 16/9;\n  background: linear-gradient(135deg, #e0f2fe, #bfdbfe);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 48px;\n}\n\n.blog-content {\n  padding: 20px;\n}\n\n.blog-meta {\n  display: flex;\n  gap: 12px;\n  margin-bottom: 12px;\n}\n\n.blog-category {\n  padding: 3px 10px;\n  background: #eff6ff;\n  color: #3b82f6;\n  font-size: 12px;\n  font-weight: 500;\n  border-radius: 4px;\n}\n\n.blog-date {\n  font-size: 12px;\n  color: #94a3b8;\n}\n\n.blog-title {\n  font-size: 18px;\n  font-weight: 600;\n  color: #1e293b;\n  margin-bottom: 8px;\n  line-height: 1.4;\n}\n\n.blog-excerpt {\n  font-size: 14px;\n  color: #64748b;\n  line-height: 1.6;\n  margin-bottom: 16px;\n}\n\n.blog-footer {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n.blog-author {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 13px;\n  color: #475569;\n}\n\n.blog-avatar {\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;\n  background: #e2e8f0;\n}\n\n.blog-read-more {\n  font-size: 13px;\n  color: #3b82f6;\n  cursor: pointer;\n}"
      }
    },
    {
      id: 'btn-primary-group', name: '主要按钮组', category: '组件', subcategory: '按钮',
      tags: ['按钮', '主要', '组', '组件'],
      description: '3 种主要按钮样式：实心、轮廓和幽灵按钮。',
      free: true, previewType: 'code-block',
      code: {
        html: '<div class="btn-group-demo">\n  <button class="btn btn-solid">实心按钮</button>\n  <button class="btn btn-outline">轮廓按钮</button>\n  <button class="btn btn-ghost">幽灵按钮</button>\n</div>',
        css: "/* 按钮基础样式 */\n.btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 10px 20px;\n  font-size: 14px;\n  font-weight: 500;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  text-decoration: none;\n}\n\n/* 实心按钮 */\n.btn-solid {\n  background: #3b82f6;\n  color: white;\n  border: none;\n}\n\n.btn-solid:hover {\n  background: #2563eb;\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);\n}\n\n/* 轮廓按钮 */\n.btn-outline {\n  background: transparent;\n  color: #3b82f6;\n  border: 1.5px solid #3b82f6;\n}\n\n.btn-outline:hover {\n  background: #eff6ff;\n  border-color: #2563eb;\n}\n\n/* 幽灵按钮 */\n.btn-ghost {\n  background: transparent;\n  color: #64748b;\n  border: none;\n}\n\n.btn-ghost:hover {\n  background: #f1f5f9;\n  color: #1e293b;\n}\n\n/* 按钮组 */\n.btn-group-demo {\n  display: flex;\n  gap: 12px;\n  padding: 20px;\n}"
      }
    },
    {
      id: 'form-login', name: '登录表单', category: '组件', subcategory: '表单',
      tags: ['表单', '登录', '认证', '组件'],
      description: '简洁的登录表单，支持邮箱密码登录和第三方登录。',
      free: true, previewType: 'code-block',
      code: {
        html: '<div class="login-card">\n  <div class="login-header">\n    <h2>欢迎回来</h2>\n    <p>请登录您的账号</p>\n  </div>\n  <form class="login-form">\n    <div class="form-group">\n      <label for="email">邮箱地址</label>\n      <input type="email" id="email" placeholder="请输入邮箱">\n    </div>\n    <div class="form-group">\n      <label for="password">密码</label>\n      <input type="password" id="password" placeholder="请输入密码">\n    </div>\n    <div class="form-options">\n      <label class="checkbox-label"><input type="checkbox"> 记住我</label>\n      <a href="#">忘记密码？</a>\n    </div>\n    <button type="submit" class="btn btn-primary btn-full">登录</button>\n  </form>\n  <div class="login-divider"><span>或</span></div>\n  <div class="social-login">\n    <button class="btn btn-social">微信登录</button>\n    <button class="btn btn-social">GitHub</button>\n  </div>\n  <div class="login-footer">还没有账号？<a href="#">立即注册</a></div>\n</div>',
        css: ".login-card {\n  width: 380px;\n  background: white;\n  border-radius: 16px;\n  padding: 32px;\n  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);\n}\n\n.login-header {\n  text-align: center;\n  margin-bottom: 28px;\n}\n\n.login-header h2 {\n  font-size: 24px;\n  font-weight: 700;\n  color: #1e293b;\n  margin-bottom: 8px;\n}\n\n.login-header p {\n  font-size: 14px;\n  color: #64748b;\n}\n\n.form-group {\n  margin-bottom: 16px;\n}\n\n.form-group label {\n  display: block;\n  font-size: 13px;\n  font-weight: 500;\n  color: #374151;\n  margin-bottom: 6px;\n}\n\n.form-group input {\n  width: 100%;\n  padding: 10px 12px;\n  border: 1px solid #e2e8f0;\n  border-radius: 8px;\n  font-size: 14px;\n  transition: border-color 0.2s;\n}\n\n.form-group input:focus {\n  outline: none;\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n}\n\n.form-options {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 20px;\n  font-size: 13px;\n}\n\n.checkbox-label {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  color: #64748b;\n  cursor: pointer;\n}\n\n.form-options a {\n  color: #3b82f6;\n  text-decoration: none;\n}\n\n.btn-full {\n  width: 100%;\n  padding: 12px;\n}\n\n.btn-primary {\n  background: #3b82f6;\n  color: white;\n  border: none;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n\n.btn-primary:hover {\n  background: #2563eb;\n}\n\n.login-divider {\n  position: relative;\n  text-align: center;\n  margin: 24px 0;\n}\n\n.login-divider::before {\n  content: '';\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 50%;\n  height: 1px;\n  background: #e2e8f0;\n}\n\n.login-divider span {\n  position: relative;\n  background: white;\n  padding: 0 12px;\n  color: #94a3b8;\n  font-size: 13px;\n}\n\n.social-login {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n  margin-bottom: 20px;\n}\n\n.btn-social {\n  padding: 10px;\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 8px;\n  font-size: 13px;\n  color: #475569;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n\n.btn-social:hover {\n  background: #f1f5f9;\n}\n\n.login-footer {\n  text-align: center;\n  font-size: 13px;\n  color: #64748b;\n}\n\n.login-footer a {\n  color: #3b82f6;\n  text-decoration: none;\n  font-weight: 500;\n}"
      }
    },

    // ========== 背景素材 (5个) ==========
    {
      id: 'gradient-mesh', name: 'Mesh 渐变背景', category: '背景', subcategory: '渐变背景',
      tags: ['背景', '渐变', 'Mesh', '时尚'],
      description: '时尚的 Mesh 渐变背景效果，适合现代网页设计。',
      free: true, previewType: 'code-block',
      code: {
        css: ".bg-mesh-gradient {\n  background-color: #ff6b6b;\n  background-image:\n    radial-gradient(at 40% 20%, #f59e0b 0px, transparent 50%),\n    radial-gradient(at 80% 0%, #3b82f6 0px, transparent 50%),\n    radial-gradient(at 0% 50%, #8b5cf6 0px, transparent 50%),\n    radial-gradient(at 80% 50%, #ec4899 0px, transparent 50%),\n    radial-gradient(at 0% 100%, #14b8a6 0px, transparent 50%),\n    radial-gradient(at 80% 100%, #f97316 0px, transparent 50%);\n  min-height: 100vh;\n}\n\n/* 柔和版本 */\n.bg-mesh-soft {\n  background-color: #faf5ff;\n  background-image:\n    radial-gradient(at 40% 20%, rgba(167, 139, 250, 0.3) 0px, transparent 50%),\n    radial-gradient(at 80% 0%, rgba(96, 165, 250, 0.3) 0px, transparent 50%),\n    radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),\n    radial-gradient(at 80% 50%, rgba(245, 158, 11, 0.2) 0px, transparent 50%);\n  min-height: 100vh;\n}"
      }
    },
    {
      id: 'dot-pattern', name: '圆点图案背景', category: '背景', subcategory: '图案背景',
      tags: ['背景', '圆点', '图案', '简约'],
      description: '简约的圆点图案背景，使用纯 CSS 实现。',
      free: true, previewType: 'code-block',
      code: {
        css: ".bg-dot-pattern {\n  background-color: #f8fafc;\n  background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);\n  background-size: 24px 24px;\n  min-height: 100vh;\n}\n\n/* 大圆点 */\n.bg-dot-large {\n  background-color: #f1f5f9;\n  background-image: radial-gradient(circle, #94a3b8 2px, transparent 2px);\n  background-size: 40px 40px;\n  min-height: 100vh;\n}\n\n/* 彩色圆点 */\n.bg-dot-colorful {\n  background-color: #fafafa;\n  background-image:\n    radial-gradient(circle, #3b82f6 1px, transparent 1px),\n    radial-gradient(circle, #ec4899 1px, transparent 1px);\n  background-size: 30px 30px, 30px 30px;\n  background-position: 0 0, 15px 15px;\n  min-height: 100vh;\n}"
      }
    },
    {
      id: 'grid-pattern', name: '网格图案背景', category: '背景', subcategory: '图案背景',
      tags: ['背景', '网格', '图案', '设计'],
      description: '专业的网格图案背景，适合技术文档和设计工具界面。',
      free: true, previewType: 'code-block',
      code: {
        css: ".bg-grid-pattern {\n  background-color: #f8fafc;\n  background-image:\n    linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px),\n    linear-gradient(90deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px);\n  background-size: 40px 40px;\n  min-height: 100vh;\n}\n\n/* 大网格 */\n.bg-grid-large {\n  background-color: #f1f5f9;\n  background-image:\n    linear-gradient(rgba(100, 116, 139, 0.15) 1px, transparent 1px),\n    linear-gradient(90deg, rgba(100, 116, 139, 0.15) 1px, transparent 1px);\n  background-size: 80px 80px;\n  min-height: 100vh;\n}"
      }
    },
    {
      id: 'wave-top', name: '波浪顶部装饰', category: '背景', subcategory: '装饰背景',
      tags: ['背景', '波浪', '装饰', 'SVG'],
      description: '使用 SVG 实现的波浪顶部装饰效果。',
      free: true, previewType: 'code-block',
      code: {
        html: '<div class="wave-section">\n  <div class="wave-content"><h2>内容区域</h2><p>波浪装饰下方的内容</p></div>\n  <svg class="wave-svg" viewBox="0 0 1440 120" preserveAspectRatio="none">\n    <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" fill="#3b82f6"/>\n  </svg>\n</div>',
        css: ".wave-section {\n  position: relative;\n  padding-top: 80px;\n  background: #f8fafc;\n}\n\n.wave-svg {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100px;\n}\n\n.wave-content {\n  position: relative;\n  z-index: 1;\n  text-align: center;\n  padding: 40px 24px 80px;\n}"
      }
    },
    {
      id: 'diagonal-cut', name: '斜切装饰', category: '背景', subcategory: '装饰背景',
      tags: ['背景', '斜切', '装饰', '分割'],
      description: '斜切分割装饰效果，用于两个区域之间的过渡。',
      free: true, previewType: 'code-block',
      code: {
        html: '<div class="diagonal-section">\n  <div class="diagonal-top"><h2>上半部分内容</h2></div>\n  <div class="diagonal-bottom"><h2>下半部分内容</h2></div>\n</div>',
        css: ".diagonal-section {\n  position: relative;\n}\n\n.diagonal-top {\n  background: #3b82f6;\n  color: white;\n  padding: 80px 24px 120px;\n  text-align: center;\n  clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%);\n}\n\n.diagonal-bottom {\n  background: #f8fafc;\n  padding: 80px 24px;\n  text-align: center;\n  margin-top: -40px;\n}"
      }
    },

    // ========== 加载状态素材 (3个) ==========
    {
      id: 'skeleton', name: '骨架屏', category: '加载状态', subcategory: '骨架屏',
      tags: ['加载', '骨架屏', '占位', 'UI'],
      description: '骨架屏加载效果，用于内容加载时的占位展示。',
      free: true, previewType: 'code-block',
      code: {
        html: '<div class="skeleton-card">\n  <div class="skeleton-header">\n    <div class="skeleton-avatar"></div>\n    <div class="skeleton-lines">\n      <div class="skeleton-line" style="width: 60%"></div>\n      <div class="skeleton-line" style="width: 40%"></div>\n    </div>\n  </div>\n  <div class="skeleton-image"></div>\n  <div class="skeleton-content">\n    <div class="skeleton-line"></div>\n    <div class="skeleton-line"></div>\n    <div class="skeleton-line" style="width: 80%"></div>\n  </div>\n</div>',
        css: ".skeleton-card {\n  width: 300px;\n  background: white;\n  border-radius: 12px;\n  padding: 16px;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);\n}\n\n.skeleton-header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  margin-bottom: 16px;\n}\n\n.skeleton-avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: #e2e8f0;\n  animation: skeleton-pulse 1.5s ease-in-out infinite;\n}\n\n.skeleton-lines {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.skeleton-line {\n  height: 14px;\n  background: #e2e8f0;\n  border-radius: 4px;\n  animation: skeleton-pulse 1.5s ease-in-out infinite;\n}\n\n.skeleton-image {\n  width: 100%;\n  aspect-ratio: 16/9;\n  background: #e2e8f0;\n  border-radius: 8px;\n  margin-bottom: 16px;\n  animation: skeleton-pulse 1.5s ease-in-out infinite;\n}\n\n.skeleton-content {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n@keyframes skeleton-pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.5; }\n}"
      }
    },
    {
      id: 'spinner', name: '旋转加载', category: '加载状态', subcategory: '加载器',
      tags: ['加载', '旋转', '加载器', 'UI'],
      description: '多种旋转加载动画效果。',
      free: true, previewType: 'code-block',
      code: {
        html: '<div class="spinner-demo">\n  <div class="spinner-ring"></div>\n  <div class="spinner-dots">\n    <div class="spinner-dot"></div>\n    <div class="spinner-dot"></div>\n    <div class="spinner-dot"></div>\n  </div>\n</div>',
        css: ".spinner-demo {\n  display: flex;\n  gap: 32px;\n  align-items: center;\n  padding: 20px;\n}\n\n/* 圆环旋转 */\n.spinner-ring {\n  width: 32px;\n  height: 32px;\n  border: 3px solid #e2e8f0;\n  border-top-color: #3b82f6;\n  border-radius: 50%;\n  animation: spin 0.8s linear infinite;\n}\n\n/* 点旋转 */\n.spinner-dots {\n  display: flex;\n  gap: 4px;\n}\n\n.spinner-dot {\n  width: 8px;\n  height: 8px;\n  background: #3b82f6;\n  border-radius: 50%;\n  animation: dot-spin 1.4s ease-in-out infinite;\n}\n\n.spinner-dot:nth-child(2) { animation-delay: 0.2s; }\n.spinner-dot:nth-child(3) { animation-delay: 0.4s; }\n\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\n@keyframes dot-spin {\n  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }\n  40% { transform: scale(1); opacity: 1; }\n}"
      }
    },
    {
      id: 'dot-bounce', name: '点跳加载', category: '加载状态', subcategory: '加载器',
      tags: ['加载', '弹跳', '动画', 'UI'],
      description: '弹跳点加载动画效果，适合聊天界面和内容加载。',
      free: true, previewType: 'code-block',
      code: {
        html: '<div class="bounce-demo">\n  <div class="bounce-dots">\n    <div class="bounce-dot"></div>\n    <div class="bounce-dot"></div>\n    <div class="bounce-dot"></div>\n  </div>\n</div>',
        css: ".bounce-demo {\n  display: flex;\n  gap: 40px;\n  align-items: center;\n  padding: 20px;\n}\n\n.bounce-dots {\n  display: flex;\n  gap: 6px;\n}\n\n.bounce-dot {\n  width: 12px;\n  height: 12px;\n  background: #3b82f6;\n  border-radius: 50%;\n  animation: bounce 1.4s ease-in-out infinite;\n}\n\n.bounce-dot:nth-child(1) { animation-delay: -0.32s; }\n.bounce-dot:nth-child(2) { animation-delay: -0.16s; }\n\n@keyframes bounce {\n  0%, 80%, 100% { transform: translateY(0); }\n  40% { transform: translateY(-16px); }\n}"
      }
    }
  ];
})();
