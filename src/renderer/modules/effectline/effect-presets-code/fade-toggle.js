export function generateCSS(selector) {
      return [
        selector + ' {',
        '  transition: opacity 0.4s ease;',
        '}',
        selector + '.lf-faded-out {',
        '  opacity: 0 !important;',
        '}'
      ].join('\n');
    }

export function generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_fadeToggle) return;\n  el.__lf_fadeToggle = true;\n  el.addEventListener('click', function(){\n    el.classList.toggle('lf-faded-out');\n  });\n})();";
    }

export default { generateCSS, generateJS };
