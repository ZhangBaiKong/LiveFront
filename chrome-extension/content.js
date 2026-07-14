// LiveFront Bridge — Content Script
// 在 AI 网页中运行，负责找到输入框并自动填入发送

(function () {
  'use strict';

  // 各平台配置：输入框选择器 + 发送按钮选择器 + 延迟
  const PLATFORMS = {
    chatgpt: {
      name: 'ChatGPT',
      urlPatterns: ['chatgpt.com', 'chat.openai.com'],
      input: {
        selectors: [
          '#prompt-textarea',
          'textarea[data-id="root"]',
          'div[contenteditable="true"][data-placeholder]',
          'div[contenteditable="true"]',
        ],
        type: 'auto',
      },
      sendButton: {
        selectors: [
          'button[data-testid="send-button"]',
          'button[aria-label="Send prompt"]',
          'button[aria-label*="Send"]',
        ],
      },
      inputDelay: 150,
      sendDelay: 500,
    },
    claude: {
      name: 'Claude',
      urlPatterns: ['claude.ai'],
      input: {
        selectors: [
          'div[contenteditable="true"].ProseMirror',
          'div[contenteditable="true"][data-placeholder]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        type: 'auto',
      },
      sendButton: {
        selectors: [
          'button[aria-label="Send Message"]',
          'button[aria-label="Send message"]',
          'button.send-button',
          'button[aria-label*="send"]',
        ],
      },
      inputDelay: 150,
      sendDelay: 600,
    },
    doubao: {
      name: '豆包',
      urlPatterns: ['doubao.com'],
      input: {
        selectors: ['textarea', 'div[contenteditable="true"]'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[class*="send"]', 'button[aria-label*="发送"]'],
      },
      inputDelay: 150,
      sendDelay: 500,
    },
    kimi: {
      name: 'Kimi',
      urlPatterns: ['kimi.moonshot.cn'],
      input: {
        selectors: ['div[contenteditable="true"]', 'textarea', '.editor-content [contenteditable]'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[class*="send"]', 'button[aria-label*="发送"]', 'button[class*="submit"]'],
      },
      inputDelay: 150,
      sendDelay: 600,
    },
    tongyi: {
      name: '通义千问',
      urlPatterns: ['tongyi.aliyun.com', 'qwen.aliyun.com'],
      input: {
        selectors: ['textarea', 'div[contenteditable="true"]', '#chat-input', '[class*="input"] textarea'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[class*="send"]', 'button[aria-label*="发送"]', '[class*="send"] button'],
      },
      inputDelay: 150,
      sendDelay: 600,
    },
    wenxin: {
      name: '文心一言',
      urlPatterns: ['yiyan.baidu.com'],
      input: {
        selectors: ['textarea', 'div[contenteditable="true"]', '[class*="input"] textarea'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[class*="send"]', 'button[aria-label*="发送"]', '[class*="send"]'],
      },
      inputDelay: 150,
      sendDelay: 600,
    },
    deepseek: {
      name: 'DeepSeek',
      urlPatterns: ['chat.deepseek.com'],
      input: {
        selectors: ['textarea', 'div[contenteditable="true"]', 'textarea[placeholder]'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['div[class*="input"] button', 'button[class*="send"]', 'button[aria-label*="Send"]'],
      },
      inputDelay: 150,
      sendDelay: 500,
    },
    gemini: {
      name: 'Gemini',
      urlPatterns: ['gemini.google.com'],
      input: {
        selectors: ['div[contenteditable="true"]', '.ql-editor', 'textarea'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[aria-label="Send message"]', 'button[aria-label*="send"]', 'button[class*="send"]'],
      },
      inputDelay: 200,
      sendDelay: 600,
    },
    perplexity: {
      name: 'Perplexity',
      urlPatterns: ['perplexity.ai'],
      input: {
        selectors: ['textarea', 'div[contenteditable="true"]'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[aria-label="Submit"]', 'button[class*="submit"]', 'button[class*="send"]'],
      },
      inputDelay: 150,
      sendDelay: 500,
    },
    mimo: {
      name: 'MiMo AI Studio',
      urlPatterns: ['aistudio.xiaomimimo.com', 'xiaomimimo.com'],
      input: {
        selectors: [
          'textarea',
          'div[contenteditable="true"]',
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="消息"]',
          'textarea[placeholder*="send"]',
          '.chat-input textarea',
          '.input-area textarea',
          '[class*="chat"] textarea',
          '[class*="input"] textarea',
        ],
        type: 'auto',
      },
      sendButton: {
        selectors: [
          'button[class*="send"]',
          'button[aria-label*="发送"]',
          'button[aria-label*="send"]',
          'button[class*="submit"]',
          '.chat-input button',
          '[class*="send"]',
          '[class*="submit"]',
        ],
      },
      inputDelay: 200,
      sendDelay: 800,
    },
    v0: {
      name: 'v0',
      urlPatterns: ['v0.dev'],
      input: {
        selectors: ['textarea', 'div[contenteditable="true"]'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[type="submit"]', 'button[class*="send"]'],
      },
      inputDelay: 150,
      sendDelay: 500,
    },
    bolt: {
      name: 'Bolt.new',
      urlPatterns: ['bolt.new'],
      input: {
        selectors: ['textarea', 'div[contenteditable="true"]'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[type="submit"]', 'button[class*="send"]', 'button[aria-label*="Send"]'],
      },
      inputDelay: 150,
      sendDelay: 500,
    },
    lovable: {
      name: 'Lovable',
      urlPatterns: ['lovable.dev'],
      input: {
        selectors: ['textarea', 'div[contenteditable="true"]'],
        type: 'auto',
      },
      sendButton: {
        selectors: ['button[type="submit"]', 'button[class*="send"]'],
      },
      inputDelay: 150,
      sendDelay: 500,
    },
  };

  // 检测当前页面是哪个 AI 平台
  function detectPlatform() {
    const url = window.location.href;
    for (const [key, cfg] of Object.entries(PLATFORMS)) {
      for (const pattern of cfg.urlPatterns) {
        if (url.includes(pattern)) return key;
      }
    }
    return 'unknown';
  }

  const platform = detectPlatform();
  console.log('[LiveFront Bridge] Detected platform:', platform);

  // 获取当前平台配置
  function getPlatformConfig() {
    return PLATFORMS[platform] || null;
  }

  // 通用选择器探测：按优先级尝试选择器列表，返回第一个匹配的元素
  function probeSelectors(selectorList) {
    for (const sel of selectorList) {
      try {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) return el; // visible element
      } catch (e) { /* skip invalid selector */ }
    }
    return null;
  }

  // 兜底探测：当预设选择器全部失败时，用通用方法搜索输入框
  function fallbackFindInput() {
    // 1. 搜索所有 textarea 元素
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      if (ta.offsetParent !== null && ta.offsetHeight > 10) return ta;
    }
    // 2. 搜索所有 contenteditable 元素
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const el of editables) {
      if (el.offsetParent !== null && el.offsetHeight > 10) return el;
    }
    // 3. 搜索 placeholder 包含关键词的元素
    const keywords = ['输入', '消息', 'send', 'input', '输入消息', 'Ask'];
    for (const kw of keywords) {
      const el = document.querySelector('[placeholder*="' + kw + '" i]');
      if (el && el.offsetParent !== null) return el;
    }
    // 4. 搜索 class 包含 chat/input/editor 的元素
    const classPatterns = ['chat', 'input', 'editor', 'prompt'];
    for (const pat of classPatterns) {
      const el = document.querySelector('[class*="' + pat + '"] textarea, [class*="' + pat + '"] [contenteditable="true"]');
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }

  // 兜底探测：发送按钮
  function fallbackFindSendButton() {
    const patterns = [
      'button[class*="send"]',
      'button[class*="submit"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="发送"]',
      'button[aria-label*="submit"]',
      'button[type="submit"]',
    ];
    for (const sel of patterns) {
      const btns = document.querySelectorAll(sel);
      for (const btn of btns) {
        if (btn.offsetParent !== null && !btn.disabled) return btn;
      }
    }
    return null;
  }

  // 填入文本到输入框
  function fillInput(text) {
    const cfg = getPlatformConfig();
    let input = null;

    // 先用平台特定选择器
    if (cfg) {
      input = probeSelectors(cfg.input.selectors);
    }

    // 兜底探测
    if (!input) {
      console.log('[LiveFront Bridge] Platform selectors failed, trying fallback detection...');
      input = fallbackFindInput();
    }

    if (!input) {
      console.error('[LiveFront Bridge] Input not found for', platform);
      showNotFoundTip();
      return false;
    }

    // contenteditable div 的处理方式
    if (input.contentEditable === 'true') {
      input.focus();
      input.innerHTML = '';
      const paragraphs = text.split('\n');
      paragraphs.forEach((p) => {
        const pEl = document.createElement('p');
        if (p === '') {
          pEl.innerHTML = '<br>';
        } else {
          pEl.textContent = p;
        }
        input.appendChild(pEl);
      });
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // textarea 的处理方式
    else if (input.tagName === 'TEXTAREA') {
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeSetter.call(input, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return true;
  }

  // 点击发送按钮
  function clickSend() {
    const cfg = getPlatformConfig();
    let btn = null;

    // 先用平台特定选择器
    if (cfg) {
      btn = probeSelectors(cfg.sendButton.selectors);
    }

    // 兜底探测
    if (!btn) {
      btn = fallbackFindSendButton();
    }

    if (btn) {
      const delay = cfg ? cfg.sendDelay : 500;
      setTimeout(() => btn.click(), delay);
      return true;
    }
    return false;
  }

  // 提示未找到输入框
  function showNotFoundTip() {
    // 避免重复弹窗
    if (document.getElementById('livefront-notfound-tip')) return;
    const tip = document.createElement('div');
    tip.id = 'livefront-notfound-tip';
    tip.style.cssText = [
      'position: fixed',
      'top: 20px',
      'left: 50%',
      'transform: translateX(-50%)',
      'background: #ff4d4f',
      'color: white',
      'padding: 12px 20px',
      'border-radius: 8px',
      'z-index: 999999',
      'font-size: 14px',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.3)',
      'cursor: pointer',
      'font-family: sans-serif',
    ].join(';');
    tip.textContent = '⚠️ LiveFront Bridge: 未找到输入框，请检查页面或按 F12 查看输入框的实际 class/id';
    tip.addEventListener('click', () => tip.remove());
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 8000);
  }

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'fill-and-send') {
      console.log('[LiveFront Bridge] Received summary, filling input...');

      const shouldExecute = !message.target || message.target === platform;
      if (!shouldExecute) {
        sendResponse({ success: false, reason: 'platform-mismatch' });
        return true;
      }

      const filled = fillInput(message.summary);
      if (filled) {
        setTimeout(() => {
          const sent = clickSend();
          sendResponse({ success: true, filled: true, sent });
        }, getPlatformConfig()?.inputDelay || 300);
        return true;
      } else {
        sendResponse({ success: false, reason: 'input-not-found' });
      }
    }

    if (message.type === 'get-platform') {
      sendResponse({ platform });
    }
    return true;
  });

  // 注入连接指示器小圆点
  function injectIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'livefront-indicator';
    indicator.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      'right: 20px',
      'width: 12px',
      'height: 12px',
      'border-radius: 50%',
      'background: #4a6cf7',
      'box-shadow: 0 0 8px rgba(74, 108, 247, 0.5)',
      'z-index: 99999',
      'cursor: pointer',
      'transition: transform 0.2s, opacity 0.2s',
      'opacity: 0.6',
    ].join(';');
    indicator.title = 'LiveFront Bridge 已连接';
    indicator.addEventListener('mouseenter', () => {
      indicator.style.transform = 'scale(1.5)';
      indicator.style.opacity = '1';
    });
    indicator.addEventListener('mouseleave', () => {
      indicator.style.transform = 'scale(1)';
      indicator.style.opacity = '0.6';
    });
    document.body.appendChild(indicator);
  }

  if (document.readyState === 'complete') {
    injectIndicator();
  } else {
    window.addEventListener('load', injectIndicator);
  }
})();
