import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'src/renderer/modules/materials/materials.js');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const block = `  const _materialCodeCache = new Map();
  async function loadMaterialCode(material) {
    try {
      if (material.code) return material.code;
      if (_materialCodeCache.has(material.id)) {
        material.code = _materialCodeCache.get(material.id);
        return material.code;
      }
      const mod = await import('./materials-code/' + material.id + '.js');
      const code = mod?.default || {};
      _materialCodeCache.set(material.id, code);
      material.code = code;
      return code;
    } catch (e) {
      console.warn('[Materials] load code failed:', material.id, e);
      return {};
    }
  }
`;

while (s.indexOf(block) !== s.lastIndexOf(block)) {
  s = s.replace(block, '');
}

fs.writeFileSync(p, s, 'utf8');
console.log('deduped', p);
