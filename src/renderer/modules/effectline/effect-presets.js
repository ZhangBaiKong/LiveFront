/* LiveFront 效果预设数据 */
window.LiveFront = window.LiveFront || {};

LiveFront.EffectPresets = [
  // ═══════════════ 点击效果 (click) ═══════════════
  {
    id: 'scale-press',
    name: '缩放按下',
    category: 'click',
    description: '按下时元素略微缩小，松开恢复',
    generateCSS(selector) {
      return [
        selector + ' { transition: transform 0.1s ease; }',
        selector + ':active { transform: scale(0.95); }'
      ].join('\n');
    },
    generateJS() { return ''; }
  },
  {
    id: 'ripple',
    name: '涟漪效果',
    category: 'click',
    description: '点击时从触摸点扩散出圆形涟漪',
    generateCSS(selector) {
      return [
        selector + ' { position: relative; overflow: hidden; }',
        '@keyframes lf-ripple-anim {',
        '  0% { transform: scale(0); opacity: 0.6; }',
        '  100% { transform: scale(4); opacity: 0; }',
        '}',
        selector + ' .lf-ripple-circle {',
        '  position: absolute; border-radius: 50%;',
        '  background: rgba(255,255,255,0.4);',
        '  pointer-events: none;',
        '  animation: lf-ripple-anim 0.6s ease-out;',
        '}'
      ].join('\n');
    },
    generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_ripple) return;\n  el.__lf_ripple = true;\n  el.addEventListener('mousedown', function(e){\n    var rect = el.getBoundingClientRect();\n    var circle = document.createElement('span');\n    circle.className = 'lf-ripple-circle';\n    var size = Math.max(rect.width, rect.height);\n    circle.style.width = circle.style.height = size + 'px';\n    circle.style.left = (e.clientX - rect.left - size/2) + 'px';\n    circle.style.top = (e.clientY - rect.top - size/2) + 'px';\n    el.appendChild(circle);\n    circle.addEventListener('animationend', function(){ circle.remove(); });\n  });\n})();";
    }
  },
  {
    id: 'bounce-click',
    name: '弹跳反馈',
    category: 'click',
    description: '点击时产生弹跳动画反馈',
    generateCSS(selector) {
      return [
        '@keyframes lf-bounce-click-anim {',
        '  0% { transform: scale(1); }',
        '  50% { transform: scale(0.9); }',
        '  100% { transform: scale(1); }',
        '}',
        selector + '.lf-bounce-active {',
        '  animation: lf-bounce-click-anim 0.3s ease;',
        '}'
      ].join('\n');
    },
    generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_bounce) return;\n  el.__lf_bounce = true;\n  el.addEventListener('click', function(){\n    el.classList.remove('lf-bounce-active');\n    void el.offsetWidth;\n    el.classList.add('lf-bounce-active');\n  });\n  el.addEventListener('animationend', function(){\n    el.classList.remove('lf-bounce-active');\n  });\n})();";
    }
  },

  // ═══════════════ 悬停效果 (hover) ═══════════════
  {
    id: 'hover-scale',
    name: '放大悬浮',
    category: 'hover',
    description: '鼠标悬浮时元素略微放大',
    generateCSS(selector) {
      return [
        selector + ' { transition: transform 0.3s ease; }',
        selector + ':hover { transform: scale(1.05); }'
      ].join('\n');
    },
    generateJS() { return ''; }
  },
  {
    id: 'hover-shadow',
    name: '阴影浮现',
    category: 'hover',
    description: '悬浮时元素上浮并出现阴影',
    generateCSS(selector) {
      return [
        selector + ' { transition: box-shadow 0.3s ease, transform 0.3s ease; }',
        selector + ':hover { box-shadow: 0 8px 24px rgba(0,0,0,0.15); transform: translateY(-4px); }'
      ].join('\n');
    },
    generateJS() { return ''; }
  },
  {
    id: 'hover-glow',
    name: '发光边框',
    category: 'hover',
    description: '悬浮时元素边框发出辉光',
    generateCSS(selector) {
      return [
        selector + ' { transition: box-shadow 0.3s ease; }',
        selector + ':hover { box-shadow: 0 0 20px rgba(74, 108, 247, 0.5); }'
      ].join('\n');
    },
    generateJS() { return ''; }
  },
  {
    id: 'hover-color',
    name: '颜色渐变',
    category: 'hover',
    description: '悬浮时背景和文字颜色渐变',
    generateCSS(selector) {
      return [
        selector + ' { transition: background-color 0.3s ease, color 0.3s ease; }',
        selector + ':hover { background-color: var(--accent, #4a6cf7); color: #ffffff; }'
      ].join('\n');
    },
    generateJS() { return ''; }
  },
  {
    id: 'hover-float',
    name: '上浮悬浮',
    category: 'hover',
    description: '悬浮时元素略微上移',
    generateCSS(selector) {
      return [
        selector + ' { transition: transform 0.3s ease; }',
        selector + ':hover { transform: translateY(-4px); }'
      ].join('\n');
    },
    generateJS() { return ''; }
  },

  // ═══════════════ 滚动效果 (scroll) ═══════════════
  {
    id: 'scroll-fade-in',
    name: '滚动渐入',
    category: 'scroll',
    description: '元素滚动进入视口时淡入显示',
    generateCSS(selector) {
      return [
        selector + ' { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }',
        selector + '.lf-visible { opacity: 1; transform: translateY(0); }'
      ].join('\n');
    },
    generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_scrollFade) return;\n  el.__lf_scrollFade = true;\n  var obs = new IntersectionObserver(function(entries){\n    entries.forEach(function(entry){\n      if (entry.isIntersecting) entry.target.classList.add('lf-visible');\n    });\n  }, { threshold: 0.1 });\n  obs.observe(el);\n})();";
    }
  },
  {
    id: 'scroll-slide-left',
    name: '滑入左侧',
    category: 'scroll',
    description: '元素从左侧滑入视口',
    generateCSS(selector) {
      return [
        selector + ' { opacity: 0; transform: translateX(-30px); transition: opacity 0.6s ease, transform 0.6s ease; }',
        selector + '.lf-visible { opacity: 1; transform: translateX(0); }'
      ].join('\n');
    },
    generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_scrollSlideL) return;\n  el.__lf_scrollSlideL = true;\n  var obs = new IntersectionObserver(function(entries){\n    entries.forEach(function(entry){\n      if (entry.isIntersecting) entry.target.classList.add('lf-visible');\n    });\n  }, { threshold: 0.1 });\n  obs.observe(el);\n})();";
    }
  },
  {
    id: 'scroll-slide-right',
    name: '滑入右侧',
    category: 'scroll',
    description: '元素从右侧滑入视口',
    generateCSS(selector) {
      return [
        selector + ' { opacity: 0; transform: translateX(30px); transition: opacity 0.6s ease, transform 0.6s ease; }',
        selector + '.lf-visible { opacity: 1; transform: translateX(0); }'
      ].join('\n');
    },
    generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_scrollSlideR) return;\n  el.__lf_scrollSlideR = true;\n  var obs = new IntersectionObserver(function(entries){\n    entries.forEach(function(entry){\n      if (entry.isIntersecting) entry.target.classList.add('lf-visible');\n    });\n  }, { threshold: 0.1 });\n  obs.observe(el);\n})();";
    }
  },
  {
    id: 'scroll-scale-in',
    name: '缩放进入',
    category: 'scroll',
    description: '元素从小尺寸缩放进入视口',
    generateCSS(selector) {
      return [
        selector + ' { opacity: 0; transform: scale(0.8); transition: opacity 0.6s ease, transform 0.6s ease; }',
        selector + '.lf-visible { opacity: 1; transform: scale(1); }'
      ].join('\n');
    },
    generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_scrollScale) return;\n  el.__lf_scrollScale = true;\n  var obs = new IntersectionObserver(function(entries){\n    entries.forEach(function(entry){\n      if (entry.isIntersecting) entry.target.classList.add('lf-visible');\n    });\n  }, { threshold: 0.1 });\n  obs.observe(el);\n})();";
    }
  },

  // ═══════════════ 页面效果 (page) ═══════════════
  {
    id: 'smooth-scroll',
    name: '平滑滚动',
    category: 'page',
    description: '整个页面启用平滑滚动行为',
    generateCSS() {
      return 'html { scroll-behavior: smooth; }';
    },
    generateJS() { return ''; }
  },
  {
    id: 'back-to-top',
    name: '返回顶部',
    category: 'page',
    description: '滚动后出现返回顶部浮动按钮',
    generateCSS() {
      return [
        '.lf-back-to-top {',
        '  position: fixed; bottom: 24px; right: 24px;',
        '  width: 44px; height: 44px; border-radius: 50%;',
        '  background: var(--accent, #4a6cf7); color: #fff;',
        '  border: none; cursor: pointer; font-size: 18px;',
        '  display: flex; align-items: center; justify-content: center;',
        '  opacity: 0; pointer-events: none;',
        '  transition: opacity 0.3s ease, transform 0.3s ease;',
        '  transform: translateY(10px);',
        '  z-index: 9999;',
        '}',
        '.lf-back-to-top.lf-visible {',
        '  opacity: 1; pointer-events: auto; transform: translateY(0);',
        '}',
        '.lf-back-to-top:hover {',
        '  transform: translateY(-2px);',
        '  box-shadow: 0 4px 12px rgba(0,0,0,0.2);',
        '}'
      ].join('\n');
    },
    generateJS() {
      return "(function(){\n  if (document.querySelector('.lf-back-to-top')) return;\n  var btn = document.createElement('button');\n  btn.className = 'lf-back-to-top';\n  btn.innerHTML = '&#8679;';\n  btn.setAttribute('aria-label', '\u8FD4\u56DE\u9876\u90E8');\n  document.body.appendChild(btn);\n  window.addEventListener('scroll', function(){\n    btn.classList.toggle('lf-visible', window.scrollY > 300);\n  });\n  btn.addEventListener('click', function(){\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n  });\n})();";
    }
  },

  // ═══════════════ 过渡效果 (transition) ═══════════════
  {
    id: 'expand-collapse',
    name: '展开收起',
    category: 'transition',
    description: '通过 max-height 过渡实现展开收起',
    generateCSS(selector) {
      return [
        selector + ' {',
        '  overflow: hidden;',
        '  transition: max-height 0.4s ease;',
        '}',
        selector + '.lf-collapsed {',
        '  max-height: 0 !important;',
        '}',
        selector + '.lf-expanded {',
        '  max-height: 1000px;',
        '}'
      ].join('\n');
    },
    generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_expandCollapse) return;\n  el.__lf_expandCollapse = true;\n  el.classList.add('lf-expanded');\n  el.addEventListener('click', function(){\n    if (el.classList.contains('lf-expanded')) {\n      el.style.maxHeight = el.scrollHeight + 'px';\n      void el.offsetWidth;\n      el.classList.remove('lf-expanded');\n      el.classList.add('lf-collapsed');\n    } else {\n      el.classList.remove('lf-collapsed');\n      el.classList.add('lf-expanded');\n    }\n  });\n})();";
    }
  },
  {
    id: 'fade-toggle',
    name: '淡入淡出',
    category: 'transition',
    description: '通过 opacity 过渡实现淡入淡出切换',
    generateCSS(selector) {
      return [
        selector + ' {',
        '  transition: opacity 0.4s ease;',
        '}',
        selector + '.lf-faded-out {',
        '  opacity: 0 !important;',
        '}'
      ].join('\n');
    },
    generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_fadeToggle) return;\n  el.__lf_fadeToggle = true;\n  el.addEventListener('click', function(){\n    el.classList.toggle('lf-faded-out');\n  });\n})();";
    }
  }
];