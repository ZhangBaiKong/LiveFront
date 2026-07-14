import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'src/renderer/modules/materials/materials.js');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

function replaceMaterialCodeAccess(src) {
  src = src.replace(/material\.code\.variables/g, 'material.code?.variables');
  src = src.replace(/material\.code\.css/g, 'material.code?.css');
  src = src.replace(/material\.code\.html/g, 'material.code?.html');
  src = src.replace(/material\.code\.js/g, 'material.code?.js');
  return src;
}

const before = s;
s = replaceMaterialCodeAccess(s);
fs.writeFileSync(p, s, 'utf8');
console.log('patched optional chaining', p, 'changed', before !== s);
