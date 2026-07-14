export function generateCSS(selector) {
      return [
        selector + ' { opacity: 0; transform: scale(0.8); transition: opacity 0.6s ease, transform 0.6s ease; }',
        selector + '.lf-visible { opacity: 1; transform: scale(1); }'
      ].join('\n');
    }

export function generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_scrollScale) return;\n  el.__lf_scrollScale = true;\n  var obs = new IntersectionObserver(function(entries){\n    entries.forEach(function(entry){\n      if (entry.isIntersecting) entry.target.classList.add('lf-visible');\n    });\n  }, { threshold: 0.1 });\n  obs.observe(el);\n})();";
    }

export default { generateCSS, generateJS };
