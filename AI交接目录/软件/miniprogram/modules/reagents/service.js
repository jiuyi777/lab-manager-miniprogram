const { actor, requireLab } = require('../auth/policy');
const { requireThat } = require('../../shared/errors');
const { today } = require('../../shared/time');
const { audit } = require('../audit/events');
function consume(state, input, now) {
  const user = actor(state);
  requireThat(input.requestId, '缺少提交编号');
  const prior = state.requestKeys.find(k => k.userId === user.id && k.type === 'consume' && k.key === input.requestId);
  if (prior) return state.reagentLogs.find(l => l.id === prior.id);
  const r = state.reagents.find(x => x.id === input.id);
  requireThat(r, '试剂不存在'); requireLab(user, r.labId);
  const lab = state.labs.find(l => l.id === r.labId);
  requireThat(lab && lab.status === 'active' && lab.capabilities.includes('reagents'), '该实验室未开放试剂领用');
  requireThat(r.expiry >= today(now), '该批次试剂已过期');
  requireThat(Number.isInteger(input.quantity) && input.quantity > 0, '首版按整瓶领用，请填写正整数');
  requireThat(input.quantity <= r.stock, '库存不足');
  requireThat(input.purpose && input.purpose.trim(), '请填写用途');
  if (input.sampleId) requireThat(state.samples.some(s => s.id === input.sampleId && s.userId === user.id), '只能关联自己的样品');
  const before = r.stock;
  r.stock -= input.quantity; r.version += 1;
  const log = { id: 'R-' + state.nextId++, reagentId: r.id, userId: user.id, userName: user.name,
    quantity: input.quantity, before, after: r.stock, purpose: input.purpose.trim(),
    sampleId: input.sampleId || '', at: now };
  state.reagentLogs.unshift(log);
  state.requestKeys.push({ userId: user.id, type: 'consume', key: input.requestId, id: log.id });
  audit(state, user, '试剂领用', r.id, { before, after: r.stock }, now);
  return log;
}
module.exports = { consume };
