const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const isWindows = process.platform === 'win32';
const homeDir = process.env.USERPROFILE || process.env.HOME || '';

function expandPath(inputPath) {
  if (!inputPath) return '';
  return inputPath
    .replace(/^~(?=\/|\\\\|$)/, homeDir)
    .replace(/%([^%]+)%/g, (_, name) => process.env[name] || '');
}

function readJson(filePath) {
  try {
    const normalized = expandPath(filePath);
    if (!normalized || !fs.existsSync(normalized)) return null;
    return JSON.parse(fs.readFileSync(normalized, 'utf-8'));
  } catch {
    return null;
  }
}

function fileExists(filePath) {
  try {
    const normalized = expandPath(filePath);
    return normalized ? fs.existsSync(normalized) : false;
  } catch {
    return false;
  }
}

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function extractVersionFromOutput(output) {
  if (!output) return null;
  const match = output.match(/\d+(?:\.\d+){1,3}/);
  return match ? match[0] : null;
}

function resolveExistingFile(paths) {
  for (const item of paths) {
    const resolved = expandPath(item);
    try {
      if (resolved && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
    } catch {}
  }
  return null;
}

function detectCliVersion(command) {
  const variants = [
    `${command} --version`,
    `${command} -v`,
    `${command} version`
  ];
  for (const variant of variants) {
    const output = runCommand(variant);
    const version = extractVersionFromOutput(output);
    if (version) return version;
  }
  return null;
}

function detectNpmGlobalVersion(packageName) {
  if (!packageName) return null;
  const output = runCommand(`npm list -g ${packageName} --depth=0`);
  return extractVersionFromOutput(output);
}

function whichCommand(name) {
  return isWindows ? `where ${name}` : `which ${name}`;
}

function firstExistingPath(paths) {
  for (const item of paths) {
    if (fileExists(item)) return expandPath(item);
  }
  return null;
}

function detectInstalledCli(names) {
  const found = [];
  for (const name of names) {
    const output = runCommand(whichCommand(name));
    if (output) {
      const firstLine = isWindows ? output.split(/\r?\n/)[0] : output;
      const version = detectCliVersion(name);
      found.push({ name, path: firstLine, version: version || null });
    }
  }
  return found;
}

function detectGlobalNpmPackages(patterns) {
  const found = [];
  for (const pattern of patterns) {
    const output = runCommand(`npm list -g ${pattern.package} --depth=0`);
    if (output && output.includes(pattern.package)) {
      const version = extractVersionFromOutput(output);
      found.push({ name: pattern.name, package: pattern.package, version: version || null });
    }
  }
  return found;
}

function detectRunningProcesses(keywords) {
  const found = [];
  try {
    const command = isWindows ? 'tasklist /FO CSV /NH' : 'ps -A -o comm=';
    const output = runCommand(command);
    if (!output) return found;
    const lines = output.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const processName = isWindows ? (line.split('","')[0] || '').replace(/"/g, '') : path.basename(line.trim());
      const lower = processName.toLowerCase();
      if (keywords.some(keyword => lower.includes(keyword))) {
        found.push(processName);
      }
    }
  } catch {}
  return [...new Set(found)];
}

function readMcpServersFromConfig(config) {
  if (!config || typeof config !== 'object') return [];
  const servers = config.mcpServers || config.mcp_servers || {};
  return Object.entries(servers).map(([name, value]) => ({
    name,
    command: value.command || null,
    args: Array.isArray(value.args) ? value.args : [],
    url: value.url || value.endpoint || null,
    env: value.env || null
  }));
}

function detectDesktopAgents() {
  const agents = [];
  const _home = os.homedir();

  const claudeConfigPath = firstExistingPath([
    '%APPDATA%/Claude/claude_desktop_config.json',
    '~/Library/Application Support/Claude/claude_desktop_config.json'
  ]);
  const claudeAppPath = resolveExistingFile([
    isWindows ? '%LOCALAPPDATA%/Programs/claude-desktop/Claude.exe' : '/Applications/Claude.app'
  ]);
  if (claudeConfigPath || claudeAppPath) {
    const config = readJson(claudeConfigPath);
    agents.push({
      name: 'Claude Desktop',
      type: 'desktop-app',
      status: claudeAppPath ? 'installed' : 'configured',
      path: claudeAppPath,
      configPath: claudeConfigPath,
      version: null,
      mcpServers: readMcpServersFromConfig(config)
    });
  }

  const cursorConfigPath = firstExistingPath([
    '%APPDATA%/Cursor/User/globalStorage/cursor.mcp/mcp.json',
    '.cursor/mcp.json'
  ]);
  const cursorAppPath = resolveExistingFile([
    isWindows ? '%LOCALAPPDATA%/Programs/cursor/Cursor.exe' : '/Applications/Cursor.app'
  ]);
  if (cursorConfigPath || cursorAppPath) {
    const config = readJson(cursorConfigPath);
    agents.push({
      name: 'Cursor',
      type: 'desktop-app',
      status: cursorAppPath ? 'installed' : 'configured',
      path: cursorAppPath,
      configPath: cursorConfigPath,
      version: null,
      mcpServers: readMcpServersFromConfig(config)
    });
  }

  const vscodeConfigPath = firstExistingPath([
    '.vscode/mcp.json',
    '%APPDATA%/Code/User/settings.json'
  ]);
  const vscodeAppPath = resolveExistingFile([
    isWindows ? '%LOCALAPPDATA%/Programs/Microsoft VS Code/Code.exe' : '/Applications/Visual Studio Code.app'
  ]);
  if (vscodeConfigPath || vscodeAppPath) {
    const config = readJson(vscodeConfigPath);
    agents.push({
      name: 'VS Code',
      type: 'desktop-app',
      status: vscodeAppPath ? 'installed' : 'configured',
      path: vscodeAppPath,
      configPath: vscodeConfigPath,
      version: null,
      mcpServers: readMcpServersFromConfig(config)
    });
  }

  const mimoConfigPath = firstExistingPath([
    '~/.mimo/mcp.json',
    isWindows ? '%APPDATA%/MiMo/mcp.json' : '~/Library/Application Support/MiMo/mcp.json'
  ]);
  if (mimoConfigPath) {
    const config = readJson(mimoConfigPath);
    agents.push({
      name: 'MiMo Code',
      type: 'desktop-app',
      status: 'configured',
      path: null,
      configPath: mimoConfigPath,
      version: null,
      mcpServers: readMcpServersFromConfig(config)
    });
  }

  const genericConfigPaths = [
    '~/.config/mcp/config.json',
    '~/.mcp.json',
    isWindows ? '%USERPROFILE%/.mcp.json' : null
  ].filter(Boolean);
  for (const configPath of genericConfigPaths) {
    const resolved = firstExistingPath([configPath]);
    if (resolved) {
      const config = readJson(resolved);
      agents.push({
        name: `Generic MCP (${path.basename(resolved)})`,
        type: 'mcp-server',
        status: 'configured',
        path: null,
        configPath: resolved,
        version: null,
        mcpServers: readMcpServersFromConfig(config)
      });
    }
  }

  return agents;
}

function detectCliAgents() {
  const cliAgents = [
    { name: 'Claude Code', type: 'cli', cli: 'claude', globalPackage: { name: 'Claude Code', package: '@anthropic-ai/claude-code' } },
    { name: 'Codex CLI', type: 'cli', cli: 'codex', globalPackage: { name: 'Codex CLI', package: '@anthropic-ai/codex' } },
    { name: 'MiMo Code', type: 'cli', cli: 'mimo', globalPackage: { name: 'MiMo Code', package: '@anthropic-ai/mimo' } },
    { name: 'Cursor CLI', type: 'desktop-app', cli: 'cursor', globalPackage: { name: 'Cursor CLI', package: '@anthropic-ai/cursor' } }
  ];

  const cliHits = detectInstalledCli(cliAgents.filter(item => item.cli).map(item => item.cli));
  const npmHits = detectGlobalNpmPackages(cliAgents.filter(item => item.globalPackage).map(item => item.globalPackage));
  const cliPathMap = Object.fromEntries(cliHits.map(item => [item.name, item.path]));
  const npmMap = Object.fromEntries(npmHits.map(item => [item.name, item]));

  return cliAgents.map(item => {
    const cliHit = cliPathMap[item.cli] || null;
    const npmFound = npmMap[item.name] || null;
    const status = cliHit ? 'installed' : npmFound ? 'installed' : 'not-found';
    const version = (cliHit && cliHit.version) ? cliHit.version : npmFound?.version || null;
    return {
      name: item.name,
      type: item.type,
      status,
      path: cliHit?.path || null,
      configPath: null,
      version,
      mcpServers: []
    };
  }).filter(item => item.status !== 'not-found');
}

function buildRunningProcessAgents() {
  const running = detectRunningProcesses(['mcp', 'claude', 'codex', 'mimo', 'cursor']);
  return running.map(name => ({
    name: `运行中: ${name}`,
    type: 'mcp-server',
    status: 'running',
    path: null,
    configPath: null,
    version: null,
    mcpServers: []
  }));
}

function deduplicateAgents(agents) {
  const seen = new Map();
  for (const agent of agents) {
    const key = `${agent.name}::${agent.type}`;
    const existing = seen.get(key);
    if (!existing || existing.status === 'not-found' || (agent.status === 'running' && existing.status !== 'running')) {
      if (existing?.version && !agent.version) agent.version = existing.version;
      if (existing?.configPath && !agent.configPath) agent.configPath = existing.configPath;
      if (existing?.path && !agent.path) agent.path = existing.path;
      seen.set(key, agent);
    }
  }
  return [...seen.values()];
}

async function scanAgents() {
  const detectedAgents = deduplicateAgents([
    ...detectDesktopAgents(),
    ...detectCliAgents(),
    ...buildRunningProcessAgents()
  ]);
  return { detectedAgents, scanTime: new Date().toISOString() };
}

function getAgentConfigPath(agentName) {
  const nameMap = {
    'Claude Desktop': '%APPDATA%/Claude/claude_desktop_config.json',
    'Cursor': '%APPDATA%/Cursor/User/globalStorage/cursor.mcp/mcp.json',
    'VS Code': '.vscode/mcp.json',
    'MiMo Code': '~/.mimo/mcp.json',
    'Generic MCP (config.json)': '~/.config/mcp/config.json',
    'Generic MCP (.mcp.json)': '~/.mcp.json'
  };
  const candidate = nameMap[agentName];
  return candidate ? expandPath(candidate) : null;
}

async function getAgentConfig(agentName) {
  const configPath = getAgentConfigPath(agentName);
  if (!configPath) return { success: false, error: `未知 Agent: ${agentName}` };
  const config = readJson(configPath);
  if (!config) return { success: false, error: `未找到配置文件: ${configPath}` };
  return { success: true, configPath, config, mcpServers: readMcpServersFromConfig(config) };
}

async function saveAgentConfig(agentName, config) {
  const configPath = getAgentConfigPath(agentName);
  if (!configPath) return { success: false, error: `未知 Agent: ${agentName}` };
  try {
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true, configPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { scanAgents, getAgentConfig, saveAgentConfig };
