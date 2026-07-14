const http = require('http');
const { spawn } = require('child_process');
const { URL } = require('url');

class McpClientManager {
  constructor({ sendToRenderer }) {
    this.sendToRenderer = sendToRenderer || (() => {});
    this.connections = new Map();
  }

  listServers() {
    return [...this.connections.values()].map(item => this.publicView(item));
  }

  getConfiguredServers() {
    return [...this.connections.values()].map(item => item.config);
  }

  async connectServer(config) {
    if (!config?.name) throw new Error('缺少 Server 名称');
    await this.disconnectServer(config.name);
    const entry = { config, status: 'connecting', tools: [], transport: null, pending: new Map(), nextId: 1 };
    this.connections.set(config.name, entry);
    this.emitChanged();
    try {
      if (config.transport === 'http') {
        entry.transport = await this.createHttpTransport(config);
      } else {
        entry.transport = await this.createStdioTransport(config);
      }
      entry.tools = await this.listRemoteTools(entry);
      entry.status = 'connected';
      this.emitChanged();
      return { success: true, tools: entry.tools };
    } catch (error) {
      entry.status = 'error';
      entry.lastError = error.message;
      this.emitChanged();
      throw error;
    }
  }

  async disconnectServer(name) {
    const entry = this.connections.get(name);
    if (!entry) return true;
    try {
      await entry.transport?.close?.();
    } catch {}
    this.connections.delete(name);
    this.emitChanged();
    return true;
  }

  async listTools(name) {
    const entry = this.connections.get(name);
    if (!entry) {
      const error = new Error(`未找到 MCP Server: ${name}`);
      error.code = 'SERVER_NOT_FOUND';
      throw error;
    }
    return entry.tools;
  }

  async callTool(name, tool, args) {
    const entry = this.connections.get(name);
    if (!entry) {
      const error = new Error(`未找到 MCP Server: ${name}`);
      error.code = 'SERVER_NOT_FOUND';
      throw error;
    }
    if (entry.status !== 'connected') {
      const error = new Error(`Server ${name} 未连接`);
      error.code = 'SERVER_DISCONNECTED';
      throw error;
    }
    try {
      return await entry.transport.call({ method: 'tools/call', params: { name: tool, arguments: args || {} } });
    } catch (error) {
      entry.lastError = error.message;
      this.emitChanged();
      if (/timeout|timed out/i.test(error.message)) error.code = error.code || 'TIMEOUT';
      if (/not found|unknown tool/i.test(error.message)) error.code = error.code || 'TOOL_NOT_FOUND';
      if (/invalid|missing|required/i.test(error.message)) error.code = error.code || 'INVALID_PARAMS';
      throw error;
    }
  }

  async importFromClaudeDesktop(configPath) {
    const config = await readJson(configPath);
    return this.importFromConfig('Claude Desktop', config, configPath);
  }

  async importFromCursor(configPath) {
    const config = await readJson(configPath);
    return this.importFromConfig('Cursor', config, configPath);
  }

  async importFromConfig(sourceName, config, configPath) {
    if (!config || typeof config !== 'object') return { imported: 0, servers: [] };
    const servers = config.mcpServers || config.mcp_servers || {};
    const imported = [];
    for (const [name, value] of Object.entries(servers)) {
      const resolved = {
        name,
        transport: value.url ? 'http' : 'stdio',
        command: value.command || null,
        args: Array.isArray(value.args) ? value.args : [],
        url: value.url || null,
        env: value.env || null,
        source: sourceName,
        sourcePath: configPath
      };
      try {
        await this.connectServer(resolved);
        imported.push({ name, success: true });
      } catch (error) {
        imported.push({ name, success: false, error: error.message });
      }
    }
    return { imported: imported.length, servers: imported };
  }

  publicView(entry) {
    return {
      name: entry.config.name,
      transport: entry.config.transport,
      status: entry.status,
      toolsCount: Array.isArray(entry.tools) ? entry.tools.length : 0,
      tools: entry.tools,
      source: entry.config.source || null,
      sourcePath: entry.config.sourcePath || null,
      lastError: entry.lastError || null
    };
  }

  emitChanged() {
    try {
      this.sendToRenderer('mcp:clients-changed', this.listServers());
    } catch {}
  }

  async listRemoteTools(entry) {
    const response = await entry.transport.call({ method: 'tools/list', params: {} });
    if (Array.isArray(response)) return response;
    if (response?.tools) return response.tools;
    if (response?.result?.tools) return response.result.tools;
    return [];
  }

  createId(entry) {
    return (entry.nextId++).toString();
  }

  async createHttpTransport(config) {
    const target = new URL(config.url || 'http://localhost:9528');
    return {
      call: payload => httpRequest(target, payload),
      close: async () => {}
    };
  }

  async createStdioTransport(config) {
    const child = spawn(config.command, config.args || [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...(config.env || {}) },
      shell: process.platform === 'win32'
    });
    const pending = new Map();
    let nextId = 1;
    let buffer = '';

    child.stdout.setEncoding('utf-8');
    child.stdout.on('data', chunk => {
      buffer += chunk;
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;
        try {
          const message = JSON.parse(line);
          const resolver = pending.get(message.id);
          if (resolver) {
            pending.delete(message.id);
            if (message.error) resolver.reject(new Error(message.error.message || 'MCP 调用失败'));
            else resolver.resolve(message.result ?? message);
          }
        } catch {}
      }
    });

    child.on('error', error => {
      for (const resolver of pending.values()) resolver.reject(error);
      pending.clear();
    });
    child.on('exit', () => {
      for (const resolver of pending.values()) resolver.reject(new Error('MCP 子进程已退出'));
      pending.clear();
    });

    const call = payload => {
      const id = String(nextId++);
      const message = { jsonrpc: '2.0', id, ...payload };
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        try {
          child.stdin.write(JSON.stringify(message) + '\n');
        } catch (error) {
          pending.delete(id);
          reject(error);
        }
      });
    };

    try {
      await call({ method: 'initialize', params: { capabilities: {}, clientInfo: { name: 'LiveFront', version: '0.2.0' } } });
      await call({ method: 'initialized', params: {} });
    } catch {}

    return { call, close: () => child.kill() };
  }
}

async function httpRequest(target, payload) {
  const body = JSON.stringify({ jsonrpc: '2.0', id: '1', ...payload });
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: target.hostname,
        port: target.port || 80,
        path: '/mcp/call',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      },
      response => {
        let data = '';
        response.on('data', chunk => (data += chunk));
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data || '{}');
            resolve(parsed?.result ?? parsed);
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function readJson(filePath) {
  const fs = require('fs').promises;
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

module.exports = McpClientManager;
