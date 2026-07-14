export function generateCSS(selector) {
      return [
        selector + ' { transition: background-color 0.3s ease, color 0.3s ease; }',
        selector + ':hover { background-color: var(--accent, #4a6cf7); color: #ffffff; }'
      ].join('\n');
    }

export function generateJS() { return ''; }

export default { generateCSS, generateJS };
