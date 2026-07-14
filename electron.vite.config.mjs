import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const monacoEditorPlugin = require('vite-plugin-monaco-editor');
const monaco = monacoEditorPlugin.default || monacoEditorPlugin;
import { resolve } from 'path'
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.js'),
          'mcp-client': resolve(__dirname, 'src/main/mcp-client.js'),
          'mcp-server': resolve(__dirname, 'src/main/mcp-server.js'),
          'agent-scanner': resolve(__dirname, 'src/main/agent-scanner.js'),
          'preview-server': resolve(__dirname, 'src/main/preview-server.js')
        },
        external: [
          'electron',
          'chokidar',
          'node-pty',
          'simple-git',
          'archiver'
        ]
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.js')
        },
        external: ['electron', '@electron-toolkit/preload']
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [
      monaco({ languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'], customDistPath: () => require('path').join(process.cwd(), 'out', 'renderer', 'monacoeditorwork') })
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      },
      cssCodeSplit: true
    },
    css: {
      postcss: null
    }
  }
})
