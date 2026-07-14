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
      importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap'
    },
    {
      id: 'source-han-serif', name: '思源宋体', category: '字体', subcategory: '宋体',
      tags: ['中文', '宋体', '衬线', '开源', 'Google Fonts'],
      description: 'Adobe 与 Google 联合推出的开源中文宋体，适合长文阅读和传统排版。',
      free: true, previewType: 'text',
      fontFamily: '"Noto Serif SC", serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap'
    },
    {
      id: 'alibaba-puhuiti', name: '阿里巴巴普惠体', category: '字体', subcategory: '黑体',
      tags: ['中文', '黑体', '免费商用', '阿里巴巴'],
      description: '阿里巴巴推出的免费商用中文字体，字形优美，适合各类设计场景。',
      free: true, previewType: 'text',
      fontFamily: '"Alibaba PuHuiTi 2.0", sans-serif'
    },
    {
      id: 'lxgw-wenkai', name: '霞鹜文楷', category: '字体', subcategory: '楷体',
      tags: ['中文', '楷体', '开源', '手写风格'],
      description: '基于 FONTWORKS Klee One 改造的开源中文楷体，风格清新文艺。',
      free: true, previewType: 'text',
      fontFamily: '"LXGW WenKai", cursive',
      importUrl: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai:wght@400;700&display=swap'
    },
    {
      id: 'inter', name: 'Inter', category: '字体', subcategory: '无衬线',
      tags: ['英文', '无衬线', 'UI', '开源'],
      description: '专为 UI 设计的开源英文字体，可变字重，清晰易读。',
      free: true, previewType: 'text',
      fontFamily: '"Inter", sans-serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    },
    {
      id: 'playfair', name: 'Playfair Display', category: '字体', subcategory: '衬线',
      tags: ['英文', '衬线', '优雅', '标题'],
      description: '优雅的英文衬线字体，适合标题、品牌名和正式场合使用。',
      free: true, previewType: 'text',
      fontFamily: '"Playfair Display", serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap'
    },
    {
      id: 'bebas-neue', name: 'Bebas Neue', category: '字体', subcategory: '标题',
      tags: ['英文', '标题', '大字', '海报'],
      description: '窄体无衬线字体，适合大标题、海报和数字展示。',
      free: true, previewType: 'text',
      fontFamily: '"Bebas Neue", sans-serif',
      importUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'
    },
    {
      id: 'jetbrains-mono', name: 'JetBrains Mono', category: '字体', subcategory: '等宽',
      tags: ['英文', '等宽', '代码', '开发'],
      description: 'JetBrains 推出的等宽字体，专为代码编写优化，支持连字。',
      free: true, previewType: 'text',
      fontFamily: '"JetBrains Mono", monospace',
      importUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap'
    },

    // ========== 图标素材 (4个) ==========
    {
      id: 'lucide', name: 'Lucide Icons', category: '图标', subcategory: '线性图标',
      tags: ['SVG', '图标', '开源', '线性', 'Lucide'],
      description: '2000+ 开源 SVG 图标，Feather Icons 的延续，支持 tree-shaking。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'phosphor', name: 'Phosphor Icons', category: '图标', subcategory: '多风格图标',
      tags: ['SVG', '图标', '开源', '多风格'],
      description: '6000+ 图标，支持 6 种粗细风格，适合各类 UI 设计。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'feather', name: 'Feather Icons', category: '图标', subcategory: '线性图标',
      tags: ['SVG', '图标', '开源', '简约'],
      description: '简洁优美的线性 SVG 图标集，280+ 个常用图标。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'heroicons', name: 'Heroicons', category: '图标', subcategory: 'Tailwind 风格',
      tags: ['SVG', '图标', 'Tailwind', '开源'],
      description: '由 Tailwind CSS 团队打造的图标集，支持 Outline、Solid、Mini 三种风格。',
      free: true, previewType: 'code-block'
    },

    // ========== 配色素材 (6个) ==========
    {
      id: 'tailwind-palette', name: 'Tailwind CSS 色板', category: '配色', subcategory: '基础色板',
      tags: ['Tailwind', '色板', 'CSS 变量', '配色'],
      description: 'Tailwind CSS 官方色板，从 50 到 950 共 22 个色阶。',
      free: true, previewType: 'color-swatch'
    },
    {
      id: 'ocean-breeze', name: '海洋清风配色', category: '配色', subcategory: '蓝色系',
      tags: ['蓝色', '海洋', '清新', '配色'],
      description: '清新的海洋蓝配色方案，适合科技、健康、金融类项目。',
      free: true, previewType: 'color-swatch'
    },
    {
      id: 'sunset-glow', name: '日落配色', category: '配色', subcategory: '暖色系',
      tags: ['暖色', '日落', '橙色', '配色'],
      description: '温暖的日落配色方案，适合创意、餐饮、旅游类项目。',
      free: true, previewType: 'color-swatch'
    },
    {
      id: 'forest-deep', name: '深林配色', category: '配色', subcategory: '绿色系',
      tags: ['绿色', '森林', '自然', '配色'],
      description: '深邃的森林绿配色方案，适合环保、健康、自然类项目。',
      free: true, previewType: 'color-swatch'
    },
    {
      id: 'dark-mode', name: '暗色主题配色', category: '配色', subcategory: '暗色系',
      tags: ['暗色', '深色', '专业', '配色'],
      description: '专业的暗色主题配色方案，护眼且适合开发工具和专业应用。',
      free: true, previewType: 'color-swatch'
    },
    {
      id: 'gradient-200', name: '渐变色预设集', category: '配色', subcategory: '渐变色',
      tags: ['渐变', '背景', '时尚', '配色'],
      description: '精选渐变色预设，可直接用于背景和按钮。',
      free: true, previewType: 'color-swatch'
    },

    // ========== 组件模板 (8个) ==========
    {
      id: 'navbar-fixed', name: '固定顶部导航栏', category: '组件', subcategory: '导航栏',
      tags: ['导航栏', '固定', '顶部', '组件'],
      description: '固定在页面顶部的导航栏，支持 Logo、菜单和操作按钮。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'navbar-transparent', name: '透明滚动导航', category: '组件', subcategory: '导航栏',
      tags: ['导航栏', '透明', '滚动', '组件'],
      description: '透明背景导航栏，滚动后变为实色背景，适合英雄区页面。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'hero-centered', name: '居中英雄区', category: '组件', subcategory: '英雄区',
      tags: ['英雄区', '居中', '首屏', '组件'],
      description: '居中布局的英雄区组件，适合产品着陆页首屏展示。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'hero-split', name: '左文右图英雄区', category: '组件', subcategory: '英雄区',
      tags: ['英雄区', '图文', '左右布局', '组件'],
      description: '左侧文字、右侧图片的英雄区布局，适合产品展示。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'card-product', name: '产品卡片', category: '组件', subcategory: '卡片',
      tags: ['卡片', '产品', '电商', '组件'],
      description: '产品展示卡片，包含图片、标题、价格和购买按钮。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'card-blog', name: '博客卡片', category: '组件', subcategory: '卡片',
      tags: ['卡片', '博客', '文章', '组件'],
      description: '博客文章卡片，包含封面图、标题、摘要和作者信息。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'btn-primary-group', name: '主要按钮组', category: '组件', subcategory: '按钮',
      tags: ['按钮', '主要', '组', '组件'],
      description: '3 种主要按钮样式：实心、轮廓和幽灵按钮。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'form-login', name: '登录表单', category: '组件', subcategory: '表单',
      tags: ['表单', '登录', '认证', '组件'],
      description: '简洁的登录表单，支持邮箱密码登录和第三方登录。',
      free: true, previewType: 'code-block'
    },

    // ========== 背景素材 (5个) ==========
    {
      id: 'gradient-mesh', name: 'Mesh 渐变背景', category: '背景', subcategory: '渐变背景',
      tags: ['背景', '渐变', 'Mesh', '时尚'],
      description: '时尚的 Mesh 渐变背景效果，适合现代网页设计。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'dot-pattern', name: '圆点图案背景', category: '背景', subcategory: '图案背景',
      tags: ['背景', '圆点', '图案', '简约'],
      description: '简约的圆点图案背景，使用纯 CSS 实现。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'grid-pattern', name: '网格图案背景', category: '背景', subcategory: '图案背景',
      tags: ['背景', '网格', '图案', '设计'],
      description: '专业的网格图案背景，适合技术文档和设计工具界面。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'wave-top', name: '波浪顶部装饰', category: '背景', subcategory: '装饰背景',
      tags: ['背景', '波浪', '装饰', 'SVG'],
      description: '使用 SVG 实现的波浪顶部装饰效果。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'diagonal-cut', name: '斜切装饰', category: '背景', subcategory: '装饰背景',
      tags: ['背景', '斜切', '装饰', '分割'],
      description: '斜切分割装饰效果，用于两个区域之间的过渡。',
      free: true, previewType: 'code-block'
    },

    // ========== 加载状态素材 (3个) ==========
    {
      id: 'skeleton', name: '骨架屏', category: '加载状态', subcategory: '骨架屏',
      tags: ['加载', '骨架屏', '占位', 'UI'],
      description: '骨架屏加载效果，用于内容加载时的占位展示。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'spinner', name: '旋转加载', category: '加载状态', subcategory: '加载器',
      tags: ['加载', '旋转', '加载器', 'UI'],
      description: '多种旋转加载动画效果。',
      free: true, previewType: 'code-block'
    },
    {
      id: 'dot-bounce', name: '点跳加载', category: '加载状态', subcategory: '加载器',
      tags: ['加载', '弹跳', '动画', 'UI'],
      description: '弹跳点加载动画效果，适合聊天界面和内容加载。',
      free: true, previewType: 'code-block'
    }
  ];
})();
