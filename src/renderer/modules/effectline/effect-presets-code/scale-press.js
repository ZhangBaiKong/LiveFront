export function generateCSS(selector) {
      return [
        selector + ' { transition: transform 0.1s ease; }',
        selector + ':active { transform: scale(0.95); }'
      ].join('\n');
    }

export function generateJS() { return ''; }

export default { generateCSS, generateJS };
