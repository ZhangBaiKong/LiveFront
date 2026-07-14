export function generateCSS(selector) {
      return [
        selector + ' { opacity: 0; transform: translateX(30px); transition: opacity 0.6s ease, transform 0.6s ease; }',
        selector + '.lf-visible { opacity: 1; transform: translateX(0); }'
      ].join('\n');
    }

export function generateJS(selector) {
      return "(function(){\n  var el = document.querySelector('" + selector + "');\n  if (!el || el.__lf_scrollSlideR) return;\n  el.__lf_scrollSlideR = true;\n  var obs = new IntersectionObserver(function(entries){\n    entries.forEach(function(entry){\n      if (entry.isIntersecting) entry.target.classList.add('lf-visible');\n    });\n  }, { threshold: 0.1 });\n  obs.observe(el);\n})();";
    }

export default { generateCSS, generateJS };
