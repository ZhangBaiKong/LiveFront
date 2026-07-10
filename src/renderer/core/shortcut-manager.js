/* LiveFront 快捷键管理器 */
window.LiveFront = window.LiveFront || {};

LiveFront.Shortcuts = {
  _bindings: [],

  register(keyCombo, commandId, when) {
    this._bindings.push({ keyCombo, commandId, when });
  },

  unregister(keyCombo) {
    this._bindings = this._bindings.filter(b => b.keyCombo !== keyCombo);
  },

  init() {
    document.addEventListener('keydown', (e) => {
      for (const binding of this._bindings) {
        if (this._matches(e, binding.keyCombo)) {
          if (binding.when && !this._checkWhen(binding.when)) continue;
          e.preventDefault();
          LiveFront.Commands.execute(binding.commandId);
          return;
        }
      }
    });
  },

  _matches(event, combo) {
    const parts = combo.toLowerCase().split('+').map(s => s.trim());
    const key = parts[parts.length - 1];
    const needCtrl = parts.includes('ctrl');
    const needAlt = parts.includes('alt');
    const needShift = parts.includes('shift');
    const needMeta = parts.includes('meta') || parts.includes('cmd');
    const eventKey = event.key.toLowerCase();
    return event.ctrlKey === needCtrl && event.altKey === needAlt && event.shiftKey === needShift && event.metaKey === needMeta && (eventKey === key || eventKey === key.replace('`', '`'));
  },

  _checkWhen(condition) {
    // 简单 when 条件检查，后续扩展
    return true;
  }
};
