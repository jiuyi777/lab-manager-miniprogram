const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('./helpers');
test('领用、库存与流水一起保存，重复提交不会二次扣减', () => {
  const f = fixture(), input = { id: 'NACL-01', quantity: 2, purpose: '配制样品', requestId: 'use-1' };
  const log = f.api.consume(input);
  assert.equal(f.api.consume(input).id, log.id);
  const s = f.api.snapshot();
  assert.equal(s.reagents[0].stock, 16); assert.equal(s.reagentLogs.length, 1);
  assert.equal(s.reagentLogs[0].before, 18); assert.equal(s.reagentLogs[0].after, 16);
});
test('库存不足、负数、小数、空用途与已过期批次不能领用', () => {
  const f = fixture();
  for (const quantity of [0, -1, .5, 19]) assert.throws(() => f.api.consume({ id: 'NACL-01', quantity, purpose: '测试', requestId: 'bad-' + quantity }));
  assert.throws(() => f.api.consume({ id: 'NACL-01', quantity: 1, purpose: '', requestId: 'blank' }), /用途/);
  f.store.transact(s => { s.reagents[0].expiry = '2026-10-01'; });
  assert.throws(() => f.api.consume({ id: 'NACL-01', quantity: 1, purpose: '测试', requestId: 'expired' }), /过期/);
  assert.equal(f.store.read().reagents[0].stock, 18);
});
test('样品保存后可关联预约，不能关联他人的样品', () => {
  const f = fixture();
  const sample = f.api.saveSample({ name: '薄膜', composition: '碳', process: '热处理', tests: ['SEM'] });
  const b = f.api.createBooking(f.input({ sampleId: sample.id }));
  assert.equal(b.sampleId, sample.id);
  f.api.login('teacher');
  assert.equal(f.api.snapshot().samples.length, 0);
  assert.throws(() => f.api.createBooking(f.input({ requestId: 'foreign', start: '2026-10-10 10:00', end: '2026-10-10 12:00', sampleId: sample.id })), /自己的样品/);
});
test('查询限制实验室与本人记录，日历不泄露用途或姓名', () => {
  const f = fixture();
  f.api.createBooking(f.input());
  f.api.login('teacher');
  const s = f.api.snapshot();
  assert.equal(s.reagents.length, 0);
  assert.equal(s.bookings.length, 0);
  assert.equal(s.logs.length, 0);
  assert.equal(s.calendar[0].purpose, undefined);
  assert.equal(s.calendar[0].userName, undefined);
  assert.throws(() => f.api.consume({ id: 'NACL-01', quantity: 1, purpose: '测试', requestId: 'noaccess' }), /权限/);
});
test('停用账号不能读写，存储版本不兼容时不会静默重置', () => {
  const f = fixture();
  f.store.transact(s => { s.users[0].enabled = false; });
  assert.throws(() => f.api.snapshot(), /演示账号/);
  const { KEY, createStore } = require('../miniprogram/data/store');
  const old = { schemaVersion: 99, precious: 'preserve' };
  let written = false;
  const store = createStore({ get: key => key === KEY ? old : null, set: () => { written = true; } });
  assert.throws(() => store.read(), /版本不兼容/);
  assert.equal(written, false);
});

