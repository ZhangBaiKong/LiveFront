export function generateCSS(selector) {
      return [
        selector + ' { transition: transform 0.3s ease; }',
        selector + ':hover { transform: translateY(-4px); }'
      ].join('\n');
    }

export function generateJS() { return ''; }

export default { generateCSS, generateJS };
