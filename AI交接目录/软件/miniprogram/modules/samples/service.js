const { actor } = require('../auth/policy');
const { requireThat } = require('../../shared/errors');
const { today } = require('../../shared/time');
const { audit } = require('../audit/events');
function saveSample(state, input, now) {
  const user = actor(state);
  requireThat(input.name && input.name.trim(), '请填写样品名称');
  const allowed = ['SEM', 'XRD', 'FTIR'];
  const tests = (input.tests || []).filter(t => allowed.includes(t));
  requireThat(tests.length > 0, '请至少选择一个目标测试项');
  const id = 'SMP-' + today(now).replace(/-/g, '') + '-' + String(state.nextId++).padStart(3, '0');
  const sample = { id, userId: user.id, name: input.name.trim().slice(0, 80),
    composition: (input.composition || '').slice(0, 500), process: (input.process || '').slice(0, 500),
    tests, createdAt: now };
  state.samples.unshift(sample);
  audit(state, user, '登记样品', id, { name: sample.name }, now);
  return sample;
}
module.exports = { saveSample };

