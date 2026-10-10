const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { fixture } = require('./helpers');

function page(route) {
  let definition;
  global.Page = value => { definition = value; };
  const file = path.resolve(__dirname, '../miniprogram/pages', route, 'index.js');
  delete require.cache[file]; require(file);
  const instance = Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data || {})) });
  instance.setData = patch => {
    Object.entries(patch).forEach(([key, value]) => {
      const parts = key.split('.'); let target = instance.data;
      parts.slice(0, -1).forEach(p => { target = target[p] || (target[p] = {}); });
      target[parts.at(-1)] = value;
    });
  };
  return instance;
}
const event = data => ({ currentTarget: { dataset: data } });

test('真实页面控制器连接服务：登记样品→预约→切换审批→签到→结束→归还', () => {
  const f = fixture(), notices = [], navigations = [];
  global.getApp = () => ({ services: f.api });
  global.wx = {
    showToast: value => { notices.push(value); },
    switchTab: value => navigations.push(value.url),
    redirectTo: value => navigations.push(value.url),
    reLaunch: value => navigations.push(value.url),
    navigateTo: value => navigations.push(value.url),
    navigateBack: () => {},
    showModal: value => value.success({ confirm: true })
  };
  const login = page('auth/login'); login.onShow(); login.enter();
  assert.equal(login.data.users.length, 3);
  const samples = page('samples'); samples.onShow();
  samples.setData({ form: { name: '页面样品', composition: '碳', process: '热处理', tests: ['SEM'] } });
  samples.save(); assert.equal(samples.data.items.length, 1);
  const form = page('bookings/form'); form.onLoad({ id: 'SEM-01' }); form.onShow();
  form.setData({ form: { date: '2026-10-10', start: '08:00', end: '10:00', purpose: '页面测试' }, sampleIndex: 1 });
  form.submit();
  const booking = f.api.snapshot().bookings[0];
  assert.ok(booking.sampleId);
  assert.ok(navigations.includes('/pages/bookings/detail/index?id=' + booking.id));
  f.api.login('teacher');
  const admin = page('admin'); admin.onShow();
  admin.run(event({ id: booking.id, action: 'approve', version: 1 }));
  assert.equal(admin.data.pending.length, 0);
  f.api.login('student'); f.setTime('2026-10-10 08:01');
  const detail = page('bookings/detail'); detail.onLoad({ id: booking.id }); detail.onShow();
  assert.equal(detail.data.item.canCheckin, true);
  detail.run(event({ action: 'checkin' }));
  f.setTime('2026-10-10 09:00'); detail.run(event({ action: 'finish' }));
  assert.equal(detail.data.item.status, 'awaiting_return');
  f.api.login('admin'); f.setTime('2026-10-10 09:10'); admin.onShow();
  admin.run(event({ id: booking.id, action: 'return', version: 4 }));
  const home = page('home'); home.onShow();
  assert.equal(home.data.labs[0].free, 2);
  assert.equal(notices.filter(n => n.icon === 'none').length, 0);
});
test('教室配置功能开关实际参与预约与领用校验', () => {
  const f = fixture();
  f.store.transact(s => { s.labs[0].capabilities = []; s.labs[1].capabilities = []; });
  assert.throws(() => f.api.createBooking(f.input()), /未开放仪器预约/);
  assert.throws(() => f.api.consume({ id: 'NACL-01', quantity: 1, purpose: '测试', requestId: 'config' }), /未开放试剂领用/);
});

