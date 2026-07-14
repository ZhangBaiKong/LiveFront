import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'electron.vite.config.mjs');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const old = `      monaco({ languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'], customDistPath: (_root, _outDir, _base) => path.join(process.cwd(), 'out', 'renderer', 'monacoeditorwork') })`;
const rep = `      monaco({ languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'], customDistPath: () => require('path').join(process.cwd(), 'out', 'renderer', 'monacoeditorwork') })`;
if (!s.includes(old)) throw new Error('monaco plugin call missing');
s = s.replace(old, rep);

fs.writeFileSync(p, s, 'utf8');
console.log('patched', p);
