/**
 * LiveFront v2.0 — 全局事件总线
 *
 * 提供发布/订阅模式，支持：
 *   - on(event, handler)     — 持续监听
 *   - once(event, handler)   — 一次性监听
 *   - off(event, handler)    — 取消监听
 *   - emit(event, ...args)   — 触发事件
 *
 * 所有模块通过事件总线解耦通信，避免直接依赖。
 */

export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} 事件 → 处理器集合 */
    this._listeners = new Map();
    /** @type {Map<string, Set<Function>>} 一次性监听器 */
    this._onceListeners = new Map();
  }

  /**
   * 注册持续监听
   * @param {string} event - 事件名称（支持命名空间，如 "filetree:select"）
   * @param {Function} handler - 回调函数
   * @returns {Function} 取消监听的函数
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);

    // 返回取消函数，方便在模块 dispose 时清理
    return () => this.off(event, handler);
  }

  /**
   * 注册一次性监听（触发后自动移除）
   * @param {string} event - 事件名称
   * @param {Function} handler - 回调函数
   */
  once(event, handler) {
    if (!this._onceListeners.has(event)) {
      this._onceListeners.set(event, new Set());
    }
    this._onceListeners.get(event).add(handler);
  }

  /**
   * 取消监听
   * @param {string} event - 事件名称
   * @param {Function} handler - 要移除的回调函数
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
    this._onceListeners.get(event)?.delete(handler);
  }

  /**
   * 触发事件，通知所有监听器
   * @param {string} event - 事件名称
   * @param  {...any} args - 传递给监听器的参数
   */
  emit(event, ...args) {
    // 触发持续监听器
    const listeners = this._listeners.get(event);
    if (listeners) {
      for (const handler of listeners) {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[EventBus] 处理器异常 (${event}):`, err);
        }
      }
    }

    // 触发一次性监听器并清理
    const onceListeners = this._onceListeners.get(event);
    if (onceListeners) {
      for (const handler of onceListeners) {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[EventBus] once 处理器异常 (${event}):`, err);
        }
      }
      onceListeners.clear();
    }
  }

  /**
   * 移除某个事件的所有监听器
   * @param {string} event - 事件名称
   */
  clear(event) {
    this._listeners.delete(event);
    this._onceListeners.delete(event);
  }

  /**
   * 清空所有监听器（用于应用重置或测试）
   */
  clearAll() {
    this._listeners.clear();
    this._onceListeners.clear();
  }
}

