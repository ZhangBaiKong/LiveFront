export function generateCSS(selector) {
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
    }

export function generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_bounce) return;\n  el.__lf_bounce = true;\n  el.addEventListener('click', function(){\n    el.classList.remove('lf-bounce-active');\n    void el.offsetWidth;\n    el.classList.add('lf-bounce-active');\n  });\n  el.addEventListener('animationend', function(){\n    el.classList.remove('lf-bounce-active');\n  });\n})();";
    }

export default { generateCSS, generateJS };
