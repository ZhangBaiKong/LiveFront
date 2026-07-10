const fs = require('fs');

// AI 代理 IPC 代码
const aiProxy = `
// ============ AI 代理 ============
const AI_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages'
};

ipcMain.handle('ai:request', async (_e, { provider, apiKey, model, messages, maxTokens }) => {
  const endpoint = AI_ENDPOINTS[provider] || provider;
  try {
    const headers = { 'Content-Type': 'application/json' };
    let body;

    if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      const systemMsg = messages.find(m => m.role === 'system');
      const userMsgs = messages.filter(m => m.role !== 'system');
      body = JSON.stringify({
        model, max_tokens: maxTokens || 4096,
        system: systemMsg?.content || '',
        messages: userMsgs
      });
    } else {
      headers['Authorization'] = 'Bearer ' + apiKey;
      body = JSON.stringify({ model, messages, max_tokens: maxTokens || 4096, temperature: 0.7 });
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body });
    if (!resp.ok) {
      const errText = await resp.text();
      return { error: 'API error ' + resp.status + ': ' + errText.substring(0, 200) };
    }
    const data = await resp.json();

    if (provider === 'claude') {
      return { content: data.content?.[0]?.text || '', usage: data.usage };
    }
    return { content: data.choices?.[0]?.message?.content || '', usage: data.usage };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('ai:stream-request', async (_e, { provider, apiKey, model, messages, maxTokens }) => {
  const endpoint = AI_ENDPOINTS[provider] || provider;
  try {
    const headers = { 'Content-Type': 'application/json' };
    let body;

    if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      const systemMsg = messages.find(m => m.role === 'system');
      const userMsgs = messages.filter(m => m.role !== 'system');
      body = JSON.stringify({
        model, max_tokens: maxTokens || 4096, stream: true,
        system: systemMsg?.content || '',
        messages: userMsgs
      });
    } else {
      headers['Authorization'] = 'Bearer ' + apiKey;
      body = JSON.stringify({ model, messages, max_tokens: maxTokens || 4096, temperature: 0.7, stream: true });
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body });
    if (!resp.ok) {
      const errText = await resp.text();
      return { error: 'API error ' + resp.status + ': ' + errText.substring(0, 200) };
    }

    let fullContent = '';
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          let chunk = '';
          if (provider === 'claude') {
            if (parsed.type === 'content_block_delta') chunk = parsed.delta?.text || '';
          } else {
            chunk = parsed.choices?.[0]?.delta?.content || '';
          }
          if (chunk) {
            fullContent += chunk;
            sendToRenderer('ai:stream-chunk', { chunk });
          }
        } catch {}
      }
    }

    sendToRenderer('ai:stream-end', { fullResponse: fullContent });
    return { content: fullContent };
  } catch (e) {
    return { error: e.message };
  }
});
`;

// 在 app.whenReady 之前插入
let main = fs.readFileSync('E:/wodeAI/LiveFront/src/main/index.js', 'utf-8');
const marker = 'app.whenReady()';
const idx = main.indexOf(marker);
if (idx === -1) { console.log('Marker not found'); process.exit(1); }

main = main.substring(0, idx) + aiProxy + '\n' + main.substring(idx);
fs.writeFileSync('E:/wodeAI/LiveFront/src/main/index.js', main, 'utf-8');
console.log('AI proxy added. New length:', main.length);