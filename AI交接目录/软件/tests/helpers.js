const { createStore } = require('../miniprogram/data/store');
const { createLocalServices } = require('../miniprogram/services/local');
const { parseTime } = require('../miniprogram/shared/time');
function fixture() {
  let now = parseTime('2026-10-10 07:00');
  const memory = {};
  let failWrite = false;
  const storage = {
    get: key => memory[key],
    set: (key, value) => { if (failWrite) throw new Error('存储失败'); memory[key] = JSON.parse(JSON.stringify(value)); }
  };
  const store = createStore(storage, () => now);
  const api = createLocalServices(store, () => now);
  api.login('student');
  const input = (extra = {}) => Object.assign({
    requestId: 'request-1', instrumentId: 'SEM-01', start: '2026-10-10 08:00',
    end: '2026-10-10 10:00', purpose: '形貌观察'
  }, extra);
  return { api, store, storage, input, setTime: text => { now = parseTime(text); }, clock: () => now, fail: () => { failWrite = true; } };
}
module.exports = { fixture };

