const { createSeed } = require('./seed');
const { requireThat } = require('../shared/errors');
const KEY = 'lab-manager:demo:v1';
const clone = value => JSON.parse(JSON.stringify(value));
function createStore(storage, now = Date.now) {
  function read() {
    const saved = storage.get(KEY);
    if (!saved) {
      const seed = createSeed(now());
      storage.set(KEY, seed);
      return clone(seed);
    }
    requireThat(saved.schemaVersion === 1, '演示数据版本不兼容，请先导出数据再处理');
    return clone(saved);
  }
  function transact(work) {
    // Single-device synchronous transaction. NOT a multi-user server lock.
    const draft = read();
    const result = work(draft);
    draft.revision += 1;
    storage.set(KEY, draft); // Failed write throws; UI must not announce success.
    return clone(result === undefined ? null : result);
  }
  return { read, transact };
}
function wxStorage() {
  return { get: key => wx.getStorageSync(key), set: (key, data) => wx.setStorageSync(key, data) };
}
module.exports = { createStore, wxStorage, KEY };

