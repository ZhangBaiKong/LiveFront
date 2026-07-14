export function generateCSS() {
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
    }

export function generateJS() {
      return "(function(){\n  if (document.querySelector('.lf-back-to-top')) return;\n  var btn = document.createElement('button');\n  btn.className = 'lf-back-to-top';\n  btn.innerHTML = '&#8679;';\n  btn.setAttribute('aria-label', '\u8FD4\u56DE\u9876\u90E8');\n  document.body.appendChild(btn);\n  window.addEventListener('scroll', function(){\n    btn.classList.toggle('lf-visible', window.scrollY > 300);\n  });\n  btn.addEventListener('click', function(){\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n  });\n})();";
    }

export default { generateCSS, generateJS };
