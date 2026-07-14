export function generateCSS(selector) {
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
    }

export function generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_expandCollapse) return;\n  el.__lf_expandCollapse = true;\n  el.classList.add('lf-expanded');\n  el.addEventListener('click', function(){\n    if (el.classList.contains('lf-expanded')) {\n      el.style.maxHeight = el.scrollHeight + 'px';\n      void el.offsetWidth;\n      el.classList.remove('lf-expanded');\n      el.classList.add('lf-collapsed');\n    } else {\n      el.classList.remove('lf-collapsed');\n      el.classList.add('lf-expanded');\n    }\n  });\n})();";
    }

export default { generateCSS, generateJS };
