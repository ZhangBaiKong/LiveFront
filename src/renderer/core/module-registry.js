/* LiveFront 模块注册中心 */
window.LiveFront = window.LiveFront || {};

LiveFront.modules = {
  _modules: new Map(),

  register(manifest) {
    if (!manifest.id) { console.error('[Modules] Manifest missing id'); return; }
    if (this._modules.has(manifest.id)) { console.warn('[Modules] Duplicate registration:', manifest.id); return; }
    this._modules.set(manifest.id, manifest);
    console.log(`[Modules] Registered: ${manifest.id}`);
  },

  get(id) { return this._modules.get(id); },
  getAll() { return Array.from(this._modules.values()); },
  has(id) { return this._modules.has(id); }
};
