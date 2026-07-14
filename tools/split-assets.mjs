import fs from 'fs';
import path from 'path';
import vm from 'vm';

const repo = process.cwd();
const materialsSrc = path.join(repo, 'src/renderer/modules/materials/static-data.js');
const presetsSrc = path.join(repo, 'src/renderer/modules/effectline/effect-presets.js');
const materialsOutDir = path.join(repo, 'src/renderer/modules/materials/materials-code');
const presetsOutDir = path.join(repo, 'src/renderer/modules/effectline/effect-presets-code');

fs.mkdirSync(materialsOutDir, { recursive: true });
fs.mkdirSync(presetsOutDir, { recursive: true });

const ctx = { window: {}, LiveFront: {} };
vm.createContext(ctx);
ctx.window.LiveFront = ctx.LiveFront;
vm.runInContext(fs.readFileSync(materialsSrc, 'utf8'), ctx, { filename: materialsSrc });
const materials = ctx.LiveFront.MaterialsData || [];
for (const m of materials) {
  const out = path.join(materialsOutDir, `${m.id}.js`);
  const payload = {
    css: m.code?.css || undefined,
    html: m.code?.html || undefined,
    js: m.code?.js || undefined,
    variables: m.code?.variables || undefined,
  };
  const normalized = {};
  for (const [k,v] of Object.entries(payload)) { if (v !== undefined) normalized[k] = v; }
  const content = `export default ${JSON.stringify(normalized, null, 2)};\n`;
  fs.writeFileSync(out, content, 'utf8');
}

const presetsCtx = { window: {}, LiveFront: {} };
vm.createContext(presetsCtx);
presetsCtx.window.LiveFront = presetsCtx.LiveFront;
vm.runInContext(fs.readFileSync(presetsSrc, 'utf8'), presetsCtx, { filename: presetsSrc });
const presets = presetsCtx.LiveFront.EffectPresets || [];
for (const p of presets) {
  const css = p.generateCSS.toString();
  const js = p.generateJS.toString();
  const out = path.join(presetsOutDir, `${p.id}.js`);
  const content = `export function ${css}\n\nexport function ${js}\n\nexport default { generateCSS, generateJS };\n`;
  fs.writeFileSync(out, content, 'utf8');
}

console.log(JSON.stringify({ materials: materials.length, presets: presets.length, materialsOutDir, presetsOutDir }, null, 2));
