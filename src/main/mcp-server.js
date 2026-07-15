const http = require('http');
const fs = require('fs');
const path = require('path');

class LiveFrontMcpServer {
  constructor({ getMainWindow, getProjectPath, callMcpClientTool }) {
    this.getMainWindow = getMainWindow || (() => null);
    this.getProjectPath = getProjectPath || (() => null);
    this.callMcpClientTool = callMcpClientTool || (async () => ({ success: false, error: 'MCP Client unavailable' }));
    this.server = null;
    this.port = 9528;
  }

  async start(port) {
    if (this.server) return { port: this.port };
    this.port = port || this.port;
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    return new Promise((resolve, reject) => {
      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          const fallback = this.port + 2; // 9528 -> 9530
          console.warn('[MCP] Port ' + this.port + ' in use, trying ' + fallback);
          this.server.close();
          this.server = http.createServer((req, res) => this.handleRequest(req, res));
          this.server.on('error', (e2) => reject(e2));
          this.server.listen(fallback, '127.0.0.1', () => {
            this.port = fallback;
            resolve({ port: this.port });
          });
        } else {
          reject(err);
        }
      });
      this.server.listen(this.port, '127.0.0.1', () => resolve({ port: this.port }));
    });
  }

  async stop() {
    if (!this.server) return;
    await new Promise(resolve => this.server.close(resolve));
    this.server = null;
  }

  getTools() {
    return [
      {
        name: 'get-project-structure',
        description: '获取当前项目文件结构',
        inputSchema: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'get-file-content',
        description: '读取指定文件内容',
        inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }
      },
      {
        name: 'get-current-preview',
        description: '获取当前预览区的状态',
        inputSchema: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'get-selected-element',
        description: '获取当前选中的元素信息',
        inputSchema: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'apply-code-change',
        description: '应用代码修改并刷新预览',
        inputSchema: {
          type: 'object',
          properties: {
            file: { type: 'string' },
            content: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['file', 'content']
        }
      },
      {
        name: 'get-modifications',
        description: '获取修改线中所有修改记录',
        inputSchema: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'apply-effect',
        description: '给元素添加效果',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string' },
            effectId: { type: 'string' }
          },
          required: ['selector', 'effectId']
        }
      },
      {
        name: 'export-modification-summary',
        description: '导出修改摘要',
        inputSchema: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'take-screenshot',
        description: '截取预览区截图',
        inputSchema: { type: 'object', properties: {}, required: [] }
      }
    ];
  }

  async handleRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/mcp/tools') {
      this.sendJson(res, 200, { tools: this.getTools() });
      return;
    }

    if (req.method === 'GET' && req.url === '/mcp/config') {
      this.sendJson(res, 200, this.buildExportConfig());
      return;
    }

    if (req.method === 'POST' && req.url === '/mcp/call') {
      try {
        const body = await this.readBody(req);
        const payload = JSON.parse(body || '{}');
        const result = await this.callTool(payload.tool, payload.args || {});
        this.sendJson(res, 200, result);
      } catch (error) {
        this.sendJson(res, 400, { success: false, error: error.message });
      }
      return;
    }

    this.sendJson(res, 404, { success: false, error: 'Not found' });
  }

  async callTool(toolName, args) {
    const projectPath = this.getProjectPath();
    switch (toolName) {
      case 'get-project-structure':
        return { success: true, result: { tree: projectPath ? await this.buildProjectTree(projectPath) : null } };
      case 'get-file-content':
        return { success: true, result: await this.getFileContent(projectPath, args.path) };
      case 'get-current-preview':
        return { success: true, result: await this.requestFromRenderer('mcp:request-current-preview') };
      case 'get-selected-element':
        return { success: true, result: await this.requestFromRenderer('mcp:request-selected-element') };
      case 'apply-code-change':
        return { success: true, result: await this.applyCodeChange(projectPath, args) };
      case 'get-modifications':
        return { success: true, result: await this.requestFromRenderer('mcp:request-modifications') };
      case 'apply-effect':
        return { success: true, result: await this.requestFromRenderer('mcp:apply-effect', args) };
      case 'export-modification-summary':
        return { success: true, result: await this.requestFromRenderer('mcp:export-modification-summary') };
      case 'take-screenshot':
        return { success: true, result: await this.requestFromRenderer('mcp:take-screenshot') };
      default:
        return { success: false, error: `未知工具: ${toolName}` };
    }
  }

  buildExportConfig() {
    return {
      port: this.port,
      claudeDesktop: {
        mcpServers: {
          livefront: { type: 'http', url: `http://localhost:${this.port}` }
        }
      },
      cursor: {
        mcpServers: {
          livefront: { type: 'http', url: `http://localhost:${this.port}` }
        }
      },
      generic: {
        mcpServers: {
          livefront: { type: 'http', url: `http://localhost:${this.port}` }
        }
      }
    };
  }

  async buildProjectTree(projectPath) {
    const root = { name: path.basename(projectPath), type: 'directory', children: [] };
    const stack = [{ node: root, dirPath: projectPath }];
    while (stack.length) {
      const { node, dirPath } = stack.pop();
      let entries = [];
      try {
        entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries.slice(0, 2000)) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'out' || entry.name === 'dist') continue;
        const childPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          const child = { name: entry.name, type: 'directory', children: [] };
          node.children.push(child);
          stack.push({ node: child, dirPath: childPath });
        } else {
          node.children.push({ name: entry.name, type: 'file' });
        }
      }
    }
    return root;
  }

  async getFileContent(projectPath, filePath) {
    if (!projectPath || !filePath) return { content: '', language: 'plaintext' };
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(projectPath, filePath);
    const content = await fs.promises.readFile(absolutePath, 'utf-8');
    const ext = path.extname(absolutePath).toLowerCase();
    const languageMap = { '.html': 'html', '.css': 'css', '.js': 'javascript', '.ts': 'typescript', '.json': 'json', '.md': 'markdown', '.vue': 'vue', '.jsx': 'jsx', '.tsx': 'tsx' };
    return { content, language: languageMap[ext] || 'plaintext' };
  }

  async applyCodeChange(projectPath, args) {
    if (!projectPath || !args?.file || args?.content == null) {
      return { success: false, error: '缺少 projectPath / file / content' };
    }
    const absolutePath = path.isAbsolute(args.file) ? args.file : path.join(projectPath, args.file);
    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.promises.writeFile(absolutePath, args.content, 'utf-8');
    const diff = `--- a/${args.file}\n+++ b/${args.file}\n@@ updated ${Buffer.byteLength(args.content, 'utf-8')} bytes @@\n`;
    await this.requestFromRenderer('mcp:code-change-applied', { file: args.file, description: args.description || '', diff });
    return { success: true, diff, filePath: absolutePath };
  }

  async requestFromRenderer(channel, payload) {
    const mainWindow = this.getMainWindow();
    if (!mainWindow?.webContents) return { success: false, error: '主窗口未就绪' };
    return new Promise(resolve => {
      const timeout = setTimeout(() => resolve({ success: false, error: '请求超时' }), 5000);
      const replyChannel = `${channel}:response:${Date.now()}`;
      mainWindow.webContents.once(replyChannel, (_event, data) => {
        clearTimeout(timeout);
        resolve(data ?? { success: true });
      });
      mainWindow.webContents.send(channel, { replyChannel, payload });
    });
  }

  readBody(request) {
    return new Promise((resolve, reject) => {
      let body = '';
      request.on('data', chunk => (body += chunk));
      request.on('end', () => resolve(body));
      request.on('error', reject);
    });
  }

  sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(payload));
  }
}

module.exports = LiveFrontMcpServer;
