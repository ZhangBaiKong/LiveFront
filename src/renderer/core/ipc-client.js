/* LiveFront IPC 客户端封装 */
window.LiveFront = window.LiveFront || {};

LiveFront.ipc = {
  async invoke(channel, ...args) {
    if (window.api) {
      const parts = channel.split(':');
      const [namespace, method] = parts;
      const camelMethod = method.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (window.api[namespace] && window.api[namespace][camelMethod]) {
        return window.api[namespace][camelMethod](...args);
      }
    }
    console.warn('[IPC] No handler for:', channel);
    return null;
  }
};
