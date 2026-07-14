export function generateCSS(selector) {
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
    }

export function generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_ripple) return;\n  el.__lf_ripple = true;\n  el.addEventListener('mousedown', function(e){\n    var rect = el.getBoundingClientRect();\n    var circle = document.createElement('span');\n    circle.className = 'lf-ripple-circle';\n    var size = Math.max(rect.width, rect.height);\n    circle.style.width = circle.style.height = size + 'px';\n    circle.style.left = (e.clientX - rect.left - size/2) + 'px';\n    circle.style.top = (e.clientY - rect.top - size/2) + 'px';\n    el.appendChild(circle);\n    circle.addEventListener('animationend', function(){ circle.remove(); });\n  });\n})();";
    }

export default { generateCSS, generateJS };
