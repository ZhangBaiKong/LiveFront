export function generateCSS(selector) {
      return [
        selector + ' { transition: box-shadow 0.3s ease; }',
        selector + ':hover { box-shadow: 0 0 20px rgba(74, 108, 247, 0.5); }'
      ].join('\n');
    }

export function generateJS() { return ''; }

export default { generateCSS, generateJS };
