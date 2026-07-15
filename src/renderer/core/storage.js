/* LiveFront 数据持久化 */
window.LiveFront = window.LiveFront || {};

LiveFront.Storage = {
  _STORAGE_KEY: 'livefront_data',
  _PROJECT_STORAGE_KEY: 'livefront_project_data',

  _loadFromStorage(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  _saveToStorage(storageKey, data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[Storage] Failed to persist:', storageKey, e);
    }
  },

  _data: {},
  _projectData: {},

  get(key, defaultValue) { return this._data[key] !== undefined ? this._data[key] : defaultValue; },
  set(key, value) { this._data[key] = value; this._saveToStorage(this._STORAGE_KEY, this._data); },
  delete(key) { delete this._data[key]; this._saveToStorage(this._STORAGE_KEY, this._data); },

  project: {
    get(key, defaultValue) { return LiveFront.Storage._projectData[key] !== undefined ? LiveFront.Storage._projectData[key] : defaultValue; },
    set(key, value) { LiveFront.Storage._projectData[key] = value; LiveFront.Storage._saveToStorage(LiveFront.Storage._PROJECT_STORAGE_KEY, LiveFront.Storage._projectData); },
    delete(key) { delete LiveFront.Storage._projectData[key]; LiveFront.Storage._saveToStorage(LiveFront.Storage._PROJECT_STORAGE_KEY, LiveFront.Storage._projectData); }
  },

  init() {
    this._data = this._loadFromStorage(this._STORAGE_KEY);
    this._projectData = this._loadFromStorage(this._PROJECT_STORAGE_KEY);
    console.log('[Storage] Restored from localStorage —', Object.keys(this._data).length, 'keys');
  }
};

// Auto-init on load
LiveFront.Storage.init();
