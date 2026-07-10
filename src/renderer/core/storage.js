/* LiveFront 数据持久化 */
window.LiveFront = window.LiveFront || {};

LiveFront.Storage = {
  _data: {},
  _projectData: {},

  get(key, defaultValue) { return this._data[key] !== undefined ? this._data[key] : defaultValue; },
  set(key, value) { this._data[key] = value; },
  delete(key) { delete this._data[key]; },

  project: {
    get(key, defaultValue) { return LiveFront.Storage._projectData[key] !== undefined ? LiveFront.Storage._projectData[key] : defaultValue; },
    set(key, value) { LiveFront.Storage._projectData[key] = value; },
    delete(key) { delete LiveFront.Storage._projectData[key]; }
  }
};
