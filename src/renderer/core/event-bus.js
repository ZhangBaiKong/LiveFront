/* LiveFront 全局事件总线 */
window.LiveFront = window.LiveFront || {};

LiveFront.EventBus = {
  _listeners: {},

  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  },

  off(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(h => h !== handler);
  },

  emit(event, payload) {
    const list = this._listeners[event];
    if (!list) return;
    for (const handler of list) {
      try { handler(payload); } catch (e) { console.error(`[EventBus] Error in handler for "${event}":`, e); }
    }
  },

  once(event, handler) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      handler(payload);
    };
    this.on(event, wrapper);
  }
};
