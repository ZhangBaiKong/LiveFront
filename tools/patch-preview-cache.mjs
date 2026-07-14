import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'src/renderer/modules/preview/preview.js');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

if (!s.includes('const __vueRuntimeCache =')) {
  s = s.replace(`/* LiveFront Preview Manager */\nwindow.LiveFront = window.LiveFront || {};`, `/* LiveFront Preview Manager */\nwindow.LiveFront = window.LiveFront || {};\nconst __vueRuntimeCache = new Map();`);
}

const old = `    const vueRuntimeCode = await this._fetchVueRuntime()`;
const rep = `    let vueRuntimeCode = __vueRuntimeCache.get('vue3') || sessionStorage.getItem('lf_vue_runtime_cache');\n      if (!vueRuntimeCode) {\n        vueRuntimeCode = await this._fetchVueRuntime();\n        try { sessionStorage.setItem('lf_vue_runtime_cache', vueRuntimeCode); } catch {}\n        __vueRuntimeCache.set('vue3', vueRuntimeCode);\n      }`;
if (!s.includes(old)) throw new Error('vueRuntimeCode call missing');
s = s.replace(old, rep);

fs.writeFileSync(p, s, 'utf8');
console.log('patched', p);
