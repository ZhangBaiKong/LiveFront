/* LiveFront 效果预设数据 */
window.LiveFront = window.LiveFront || {};

const _presetCodeCache = new Map();

async function loadPresetCode(presetOrId) {
  const preset = typeof presetOrId === 'string'
    ? (LiveFront.EffectPresets.find(p => p.id === presetOrId) || { id: presetOrId })
    : presetOrId;
  try {
    if (typeof preset.generateCSS === 'function') return preset;
    if (_presetCodeCache.has(preset.id)) {
      const cached = _presetCodeCache.get(preset.id);
      preset.generateCSS = cached.generateCSS;
      preset.generateJS = cached.generateJS;
      return preset;
    }
    const mod = await import('./effect-presets-code/' + preset.id + '.js');
    const code = mod?.default || {};
    _presetCodeCache.set(preset.id, code);
    preset.generateCSS = code.generateCSS || (() => '');
    preset.generateJS = code.generateJS || (() => '');
    return preset;
  } catch (e) {
    console.warn('[EffectPresets] load code failed:', preset.id, e);
    preset.generateCSS = preset.generateCSS || (() => '');
    preset.generateJS = preset.generateJS || (() => '');
    return preset;
  }
}

const EffectPresetsList = [
  // ═══════════════ 点击效果 (click) ═══════════════
  {
    id: 'scale-press',
    name: '缩放按下',
    category: 'click',
    description: '按下时元素略微缩小，松开恢复'
  },
  {
    id: 'ripple',
    name: '涟漪效果',
    category: 'click',
    description: '点击时从触摸点扩散出圆形涟漪'
  },
  {
    id: 'bounce-click',
    name: '弹跳反馈',
    category: 'click',
    description: '点击时产生弹跳动画反馈'
  },

  // ═══════════════ 悬停效果 (hover) ═══════════════
  {
    id: 'hover-scale',
    name: '放大悬浮',
    category: 'hover',
    description: '鼠标悬浮时元素略微放大'
  },
  {
    id: 'hover-shadow',
    name: '阴影浮现',
    category: 'hover',
    description: '悬浮时元素上浮并出现阴影'
  },
  {
    id: 'hover-glow',
    name: '发光边框',
    category: 'hover',
    description: '悬浮时元素边框发出辉光'
  },
  {
    id: 'hover-color',
    name: '颜色渐变',
    category: 'hover',
    description: '悬浮时背景和文字颜色渐变'
  },
  {
    id: 'hover-float',
    name: '上浮悬浮',
    category: 'hover',
    description: '悬浮时元素略微上移'
  },

  // ═══════════════ 滚动效果 (scroll) ═══════════════
  {
    id: 'scroll-fade-in',
    name: '滚动渐入',
    category: 'scroll',
    description: '元素滚动进入视口时淡入显示'
  },
  {
    id: 'scroll-slide-left',
    name: '滑入左侧',
    category: 'scroll',
    description: '元素从左侧滑入视口'
  },
  {
    id: 'scroll-slide-right',
    name: '滑入右侧',
    category: 'scroll',
    description: '元素从右侧滑入视口'
  },
  {
    id: 'scroll-scale-in',
    name: '缩放进入',
    category: 'scroll',
    description: '元素从小尺寸缩放进入视口'
  },

  // ═══════════════ 页面效果 (page) ═══════════════
  {
    id: 'smooth-scroll',
    name: '平滑滚动',
    category: 'page',
    description: '整个页面启用平滑滚动行为'
  },
  {
    id: 'back-to-top',
    name: '返回顶部',
    category: 'page',
    description: '滚动后出现返回顶部浮动按钮'
  },

  // ═══════════════ 过渡效果 (transition) ═══════════════
  {
    id: 'expand-collapse',
    name: '展开收起',
    category: 'transition',
    description: '通过 max-height 过渡实现展开收起'
  },
  {
    id: 'fade-toggle',
    name: '淡入淡出',
    category: 'transition',
    description: '通过 opacity 过渡实现淡入淡出切换'
  }
];
EffectPresetsList.loadCode = loadPresetCode;
LiveFront.EffectPresets = EffectPresetsList;