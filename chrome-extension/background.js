// LiveFront Bridge — Service Worker
// 管理与 LiveFront 桌面端的 WebSocket 连接

const LIVEFRONT_WS_URL = 'ws://localhost:9527';
let ws = null;
let reconnectTimer = null;
let status = 'disconnected'; // disconnected | connecting | connected

// 连接 LiveFront WebSocket
function connectToLiveFront() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  status = 'connecting';
  broadcastStatus();

  try {
    ws = new WebSocket(LIVEFRONT_WS_URL);

    ws.onopen = () => {
      status = 'connected';
      broadcastStatus();
      console.log('[LiveFront Bridge] Connected to LiveFront');
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'send-summary') {
          // 收到 LiveFront 发来的修改摘要
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'fill-and-send',
              summary: message.summary,
              target: message.target
            });
          }
          // 回复 LiveFront
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'send-confirmed', success: true }));
          }
        }
      } catch (e) {
        console.error('[LiveFront Bridge] Message parse error:', e);
      }
    };

    ws.onclose = () => {
      status = 'disconnected';
      broadcastStatus();
      // 3 秒后重连
      reconnectTimer = setTimeout(connectToLiveFront, 3000);
    };

    ws.onerror = () => {
      status = 'disconnected';
      broadcastStatus();
    };
  } catch (e) {
    status = 'disconnected';
    broadcastStatus();
  }
}

// 广播状态给 popup 和 content script
function broadcastStatus() {
  chrome.runtime.sendMessage({ type: 'status-update', status }).catch(() => {});
}

// 启动时连接
connectToLiveFront();

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-status') {
    sendResponse({ status });
  }
  if (message.type === 'reconnect') {
    connectToLiveFront();
    sendResponse({ status: 'connecting' });
  }
});
