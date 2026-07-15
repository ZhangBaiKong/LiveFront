import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const configPath = path.join(cwd, 'electron.vite.config.mjs');
const editorPath = path.join(cwd, 'src/renderer/modules/editor/editor.js');
const gitPath = path.join(cwd, 'src/renderer/modules/git/git.js');
const aiPath = path.join(cwd, 'src/renderer/modules/ai/index.js');
const previewPath = path.join(cwd, 'src/renderer/modules/preview/preview.js');
const builderPath = path.join(cwd, 'electron-builder.yml');

// Vite config: correct Monaco plugin placement
{
  let s = fs.readFileSync(configPath, 'utf8');
  s = s.replace(
    `export default defineConfig({\n  main: {\n    build: {\n      rollupOptions: {\n        input: {\n          index: resolve(__dirname, 'src/main/index.js')\n        },\n        external: [\n          'electron',\n          'chokidar',\n          'node-pty',\n          'simple-git',\n          'archiver'\n        ]\n      }\n    }\n  },\n  preload: {\n    build: {\n      rollupOptions: {\n        input: {\n          index: resolve(__dirname, 'src/preload/index.js')\n        },\n        external: ['electron', '@electron-toolkit/preload']\n      }\n    }\n  },\n  plugins: [\n    monaco({ languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'] })\n  ],\n  renderer: {\n    root: resolve(__dirname, 'src/renderer'),\n    plugins: [\n      monaco({ languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'] })\n    ],\n    build: {\n      rollupOptions: {\n        input: {\n          index: resolve(__dirname, 'src/renderer/index.html')\n        }\n      },\n      cssCodeSplit: true\n    },\n    css: {\n      postcss: null\n    }\n  }\n})`,
    `export default defineConfig({\n  main: {\n    build: {\n      rollupOptions: {\n        input: {\n          index: resolve(__dirname, 'src/main/index.js')\n        },\n        external: [\n          'electron',\n          'chokidar',\n          'node-pty',\n          'simple-git',\n          'archiver'\n        ]\n      }\n    }\n  },\n  preload: {\n    build: {\n      rollupOptions: {\n        input: {\n          index: resolve(__dirname, 'src/preload/index.js')\n        },\n        external: ['electron', '@electron-toolkit/preload']\n      }\n    }\n  },\n  renderer: {\n    root: resolve(__dirname, 'src/renderer'),\n    plugins: [\n      monaco({ languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'] })\n    ],\n    build: {\n      rollupOptions: {\n        input: {\n          index: resolve(__dirname, 'src/renderer/index.html')\n        }\n      },\n      cssCodeSplit: true\n    },\n    css: {\n      postcss: null\n    }\n  }\n})`
  );
  fs.writeFileSync(configPath, s, 'utf8');
  console.log('patched', configPath);
}
