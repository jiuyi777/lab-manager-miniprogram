const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('./helpers');
const { createStore } = require('../miniprogram/data/store');
const { createLocalServices } = require('../miniprogram/services/local');

test('预约→审批→签到→结束→归还→新服务恢复，结束与确认时间独立', () => {
  const f = fixture();
  const b = f.api.createBooking(f.input());
  assert.equal(b.status, 'pending');
  f.api.login('teacher');
  const approved = f.api.bookingAction(b.id, 'approve', { version: b.version });
  f.api.login('student'); f.setTime('2026-10-10 08:01');
  const active = f.api.bookingAction(b.id, 'checkin', { version: approved.version });
  f.setTime('2026-10-10 09:20');
  const ended = f.api.bookingAction(b.id, 'finish', { version: active.version });
  f.api.login('admin'); f.setTime('2026-10-10 09:40');
  const done = f.api.bookingAction(b.id, 'return', { version: ended.version });
  assert.equal(done.status, 'completed');
  assert.equal(done.confirmedAt - done.actualEnd, 20 * 60000);
  const reopened = createLocalServices(createStore(f.storage, f.clock), f.clock);
  reopened.login('student');
  assert.equal(reopened.snapshot().bookings[0].status, 'completed');
  assert.equal(reopened.snapshot().bookings[0].actualEnd, ended.actualEnd);
});
test('重叠时段被拦截，相邻时段允许；重复请求只生成一次', () => {
  const f = fixture();
  const b = f.api.createBooking(f.input());
  assert.equal(f.api.createBooking(f.input()).id, b.id);
  assert.throws(() => f.api.createBooking(f.input({ requestId: 'second', start: '2026-10-10 09:00' })), /占用/);
  f.api.createBooking(f.input({ requestId: 'third', start: '2026-10-10 10:00', end: '2026-10-10 12:00' }));
  assert.equal(f.api.snapshot().bookings.length, 2);
});
test('学生不能审批，老师不能审批外实验室，陈旧版本不能覆盖', () => {
  const f = fixture(), b = f.api.createBooking(f.input());
  assert.throws(() => f.api.bookingAction(b.id, 'approve', { version: 1 }), /权限/);
  f.store.transact(s => { s.instruments[2].status = 'active'; });
  const other = f.api.createBooking(f.input({ requestId: '502', instrumentId: 'FTIR-03' }));
  f.api.login('teacher');
  assert.throws(() => f.api.bookingAction(other.id, 'approve', { version: 1 }), /权限/);
  f.api.bookingAction(b.id, 'approve', { version: 1 });
  assert.throws(() => f.api.bookingAction(b.id, 'reject', { version: 1, reason: '重新检查' }), /已变化/);
});
test('驳回必须给原因，取消释放时段，维护禁止新增', () => {
  const f = fixture(), b = f.api.createBooking(f.input());
  f.api.login('admin');
  assert.throws(() => f.api.bookingAction(b.id, 'reject', { version: 1, reason: ' ' }), /必填/);
  f.api.login('student');
  f.api.bookingAction(b.id, 'cancel', { version: 1 });
  f.api.createBooking(f.input({ requestId: 'new' }));
  assert.throws(() => f.api.createBooking(f.input({ requestId: 'maint', instrumentId: 'FTIR-03' })), /维护/);
});
test('培训在提交及审批时均校验；开放时段和不存在日期被拦截', () => {
  const f = fixture();
  assert.throws(() => f.api.createBooking(f.input({ start: '2026-10-10 07:30' })), /开放时段/);
  assert.throws(() => f.api.createBooking(f.input({ start: '2026-02-30 08:00' })), /不存在/);
  const b = f.api.createBooking(f.input());
  f.store.transact(s => { s.training = []; });
  f.api.login('teacher');
  assert.throws(() => f.api.bookingAction(b.id, 'approve', { version: 1 }), /培训/);
  f.api.login('student');
  assert.throws(() => f.api.createBooking(f.input({ requestId: 'new', start: '2026-10-10 10:00', end: '2026-10-10 12:00' })), /培训/);
});
test('待审到开始时间失效；审批后的预约也不能提前签到', () => {
  const f = fixture(), b = f.api.createBooking(f.input());
  f.setTime('2026-10-10 08:00');
  assert.equal(f.api.snapshot().bookings[0].status, 'expired');
  f.api.login('teacher');
  assert.throws(() => f.api.bookingAction(b.id, 'approve', { version: 2 }), /过期/);
  const g = fixture(), c = g.api.createBooking(g.input());
  g.api.login('admin'); g.api.bookingAction(c.id, 'approve', { version: 1 });
  g.api.login('student');
  assert.throws(() => g.api.bookingAction(c.id, 'checkin', { version: 2 }), /时段内/);
});
test('前一位尚未归还时阻止下一位签到，不按预约结束强制释放', () => {
  const f = fixture();
  const first = f.api.createBooking(f.input());
  const next = f.api.createBooking(f.input({ requestId: 'next', start: '2026-10-10 10:00', end: '2026-10-10 12:00' }));
  f.api.login('admin');
  f.api.bookingAction(first.id, 'approve', { version: 1 });
  f.api.bookingAction(next.id, 'approve', { version: 1 });
  f.api.login('student'); f.setTime('2026-10-10 08:00');
  f.api.bookingAction(first.id, 'checkin', { version: 2 });
  f.setTime('2026-10-10 10:01');
  assert.throws(() => f.api.bookingAction(next.id, 'checkin', { version: 2 }), /上一位/);
});
test('保存失败不留下预约或审计日志', () => {
  const f = fixture(), before = f.store.read();
  f.fail();
  assert.throws(() => f.api.createBooking(f.input()), /存储失败/);
  assert.deepEqual(f.store.read(), before);
});

