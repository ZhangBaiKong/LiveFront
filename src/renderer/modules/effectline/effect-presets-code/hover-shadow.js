export function generateCSS(selector) {
      return [
        selector + ' { transition: box-shadow 0.3s ease, transform 0.3s ease; }',
        selector + ':hover { box-shadow: 0 8px 24px rgba(0,0,0,0.15); transform: translateY(-4px); }'
      ].join('\n');
    }

export function generateJS() { return ''; }

export default { generateCSS, generateJS };
