import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'src/renderer/modules/materials/materials.js');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const loader = `  const _materialCodeCache = new Map();
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

s = s.replace(`  let _overlay = null;\n`, `  let _overlay = null;\n${loader}`);

const applyOld = `    document.getElementById('materialsApply').addEventListener('click', () => {
      LiveFront.MaterialApply.applyMaterial(material);
    });`;
const applyNew = `    document.getElementById('materialsApply').addEventListener('click', async () => {
      try { await loadMaterialCode(material); } catch {}
      LiveFront.MaterialApply.applyMaterial(material);
    });`;
if (!s.includes(applyOld)) throw new Error('applyOld missing');
s = s.replace(applyOld, applyNew);

const copyOld = `    document.getElementById('materialsCopy').addEventListener('click', () => {
      LiveFront.MaterialApply.copyCode(material);
    });`;
const copyNew = `    document.getElementById('materialsCopy').addEventListener('click', async () => {
      try { await loadMaterialCode(material); } catch {}
      LiveFront.MaterialApply.copyCode(material);
    });`;
if (!s.includes(copyOld)) throw new Error('copyOld missing');
s = s.replace(copyOld, copyNew);

fs.writeFileSync(p, s, 'utf8');
console.log('patched', p);
