// LiveFront Bridge — Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const reconnectBtn = document.getElementById('reconnectBtn');
  const platformName = document.getElementById('platformName');

  function updateStatus(status) {
    statusDot.className = 'status-dot ' + status;
    const labels = {
      connected: '已连接到 LiveFront',
      connecting: '连接中...',
      disconnected: '未连接'
    };
    statusText.textContent = labels[status] || '未知状态';
  }

  // 获取当前页面平台
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { type: 'get-platform' }, (response) => {
        if (chrome.runtime.lastError) {
          platformName.textContent = '非 AI 页面';
          platformName.style.color = '#999';
          return;
        }
        if (response && response.platform) {
          const names = {
          chatgpt: 'ChatGPT',
          claude: 'Claude',
          doubao: '豆包',
          kimi: 'Kimi',
          tongyi: '通义千问',
          wenxin: '文心一言',
          deepseek: 'DeepSeek',
          gemini: 'Gemini',
          perplexity: 'Perplexity',
          mimo: 'MiMo AI Studio',
          v0: 'v0',
          bolt: 'Bolt.new',
          lovable: 'Lovable',
          unknown: '未识别'
        };
          platformName.textContent = names[response.platform] || response.platform;
          platformName.style.color = response.platform !== 'unknown' ? '#34d399' : '#999';
        } else {
          platformName.textContent = '非 AI 页面';
          platformName.style.color = '#999';
        }
      });
    }
  } catch (e) {
    platformName.textContent = '获取失败';
  }

  // 获取连接状态
  chrome.runtime.sendMessage({ type: 'get-status' }, (response) => {
    if (response) updateStatus(response.status);
  });

  // 重新连接
  reconnectBtn.addEventListener('click', () => {
    statusText.textContent = '重新连接中...';
    statusDot.className = 'status-dot connecting';
    chrome.runtime.sendMessage({ type: 'reconnect' }, (response) => {
      if (response) updateStatus(response.status);
    });
  });

  // 监听状态变化
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'status-update') {
      updateStatus(message.status);
    }
  });
});

