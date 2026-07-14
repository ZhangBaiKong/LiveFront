import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'src/renderer/modules/materials/materials.js');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');

// Fix duplicate guard + missing matches in card color-swatch
const a = `      case 'color-swatch': {\n        const colors = _getPreviewColors(material.code?.variables);\n        if (colors.length === 0 && material.code?.css) {\n        if (colors.length === 0 && material.code?.css) {\n          const swatches = matches.slice(0, 6);\n`;
const b = `      case 'color-swatch': {\n        const colors = _getPreviewColors(material.code?.variables);\n        if (colors.length === 0 && material.code?.css) {\n          const matches = material.code?.css.match(/#[0-9a-fA-F]{3,8}/g) || [];\n          const swatches = matches.slice(0, 6);\n`;
if (!s.includes(a)) throw new Error('needleA missing');
s = s.replace(a, b);

// Ensure detail color-swatch uses optional chaining for matches
const c = `          const matches = material.code.css.match(/#[0-9a-fA-F]{3,8}/g) || [];`;
const d = `          const matches = material.code?.css.match(/#[0-9a-fA-F]{3,8}/g) || [];`;
while (s.includes(c)) s = s.replace(c, d);

// Ensure _renderCodeBlocks uses optional chaining in guard and highlight calls
const e = `    if (material.code?.css) {\n      html += '<div class="materials-code-section"><div class="materials-code-title">CSS `;
const f = `    if (material.code?.css) {\n      html += '<div class="materials-code-section"><div class="materials-code-title">CSS `;
// already handled by generic replacement below

const pairs = [
  ["_highlightCode(material.code.css)", "_highlightCode(material.code?.css)"],
  ["_highlightCode(material.code.html)", "_highlightCode(material.code?.html)"],
  ["_highlightCode(material.code.js)", "_highlightCode(material.code?.js)"],
  ["material.code.html.substring(0, 200)", "material.code?.html.substring(0, 200)"],
  ["material.code.css.substring(0, 200)", "material.code?.css.substring(0, 200)"],
  ["material.code.html + '</div>'", "material.code?.html + '</div>'"],
];
for (const [from, to] of pairs) {
  while (s.includes(from)) s = s.replace(from, to);
}

fs.writeFileSync(p, s, 'utf8');
console.log('patched', p);
