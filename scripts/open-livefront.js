const { spawn } = require('child_process');
const path = require('path');
const electron = path.resolve('node_modules/electron/cli.js');
const child = spawn(process.execPath, [electron, '.'], { cwd: process.cwd(), detached: true, stdio: 'ignore' });
child.unref();
console.log('spawned', child.pid);
