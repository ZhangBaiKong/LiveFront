export function generateCSS(selector) {
      return [
        selector + ' { transition: transform 0.3s ease; }',
        selector + ':hover { transform: scale(1.05); }'
      ].join('\n');
    }

export function generateJS() { return ''; }

export default { generateCSS, generateJS };
