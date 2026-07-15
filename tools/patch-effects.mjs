import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'src/renderer/modules/effectline/effectline.js');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

s = s.replace('  function _applyPreset(preset) {', '  async function _applyPreset(preset) {');
fs.writeFileSync(p, s, 'utf8');
console.log('patched', p);
