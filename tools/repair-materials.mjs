import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'src/renderer/modules/materials/materials.js');
let s = fs.readFileSync(p, 'utf8');

const replacements = [
  [`if (countEl) countEl.textContent = materials.length + '  个素材;`, `if (countEl) countEl.textContent = materials.length + ' 个素材';`],
  [`'<button class="materials-detail-back" id="materialsBack">← 返回素材库</button>'`, `'<button class="materials-detail-back" id="materialsBack">\\u2190 返回素材库</button>'`],
  [`'<button class="materials-btn-apply" id="materialsApply">应用到项目</button>'`, `'<button class="materials-btn-apply" id="materialsApply">应用到项目</button>'`],
  [`'<span class="materials-title">素材库</span>'`, `'<span class="materials-title">素材库</span>'`],
  [`'<button class="materials-close-btn" id="materialsClose">✕</button>'`, `'<button class="materials-close-btn" id="materialsClose">✕</button>'`],
  [`'免费</span>'`, `'免费</span>'`],
  [`' <span>' + material.name + '</span>'`, `' <span>' + material.name + '</span>'`],
  [`' <span>' + m.category + '</span>'`, `' <span>' + m.category + '</span>'`],
  [`' <span>' + m.name + '</span>'`, `' <span>' + m.name + '</span>'`],
  [`' <span>' + r.name + '</span>'`, `' <span>' + r.name + '</span>'`],
  [`' <span>' + r.subcategory + '</span>'`, `' <span>' + r.subcategory + '</span>'`],
  [`'没有找到匹配的素材</div></div>';`, `'没有找到匹配的素材</div></div>';`],
  ['countEl.textContent = materials.length + \'  个素材;', 'countEl.textContent = materials.length + \' 个素材\';'],
];

for (const [needle, replacement] of replacements) {
  if (s.includes(needle)) {
    s = s.split(needle).join(replacement);
  }
}

fs.writeFileSync(p, s, 'utf8');
console.log('repaired', p);
