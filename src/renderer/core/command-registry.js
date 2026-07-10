/* LiveFront 命令注册中心 */
window.LiveFront = window.LiveFront || {};

LiveFront.Commands = {
  _commands: {},

  register(id, handler, metadata) {
    this._commands[id] = { id, handler, ...metadata };
  },

  unregister(id) { delete this._commands[id]; },

  async execute(id, ...args) {
    const cmd = this._commands[id];
    if (!cmd) { console.warn('[Commands] Unknown command:', id); return; }
    try { return await cmd.handler(...args); }
    catch (e) { console.error(`[Commands] Error executing "${id}":`, e); }
  },

  list() { return Object.values(this._commands); }
};
