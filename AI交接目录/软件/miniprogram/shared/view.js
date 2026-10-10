const { formatTime } = require('./time');
const labels = { pending: '待审批', approved: '已通过', active: '使用中', awaiting_return: '待确认归还', completed: '已完成', cancelled: '已取消', rejected: '已驳回', expired: '申请已过期' };
function services() { return getApp().services; }
function snapshot() {
  const s = services().snapshot();
  const decorate = b => Object.assign({}, b, {
    instrumentName: (s.instruments.find(i => i.id === b.instrumentId) || {}).name || b.instrumentId,
    statusLabel: labels[b.status] || b.status,
    startText: formatTime(b.start), endText: formatTime(b.end), startClock: formatTime(b.start).slice(11), endClock: formatTime(b.end).slice(11),
    actualStartText: b.actualStart ? formatTime(b.actualStart) : '',
    actualEndText: b.actualEnd ? formatTime(b.actualEnd) : '',
    confirmedText: b.confirmedAt ? formatTime(b.confirmedAt) : '',
    canCancel: b.userId === s.user.id && ['pending', 'approved'].includes(b.status) && b.start > s.now,
    canCheckin: b.userId === s.user.id && b.status === 'approved' && s.now >= b.start && s.now < b.end,
    canFinish: b.userId === s.user.id && b.status === 'active',
    isOverdue: ['active', 'awaiting_return'].includes(b.status) && b.end < s.now
  });
  s.bookings = s.bookings.map(decorate);
  s.approvals = s.approvals.map(decorate);
  s.canManage = s.user.role !== 'student';
  s.roleLabel = { student: '学生', teacher: '老师', admin: '管理员' }[s.user.role];
  return s;
}
function error(e) { wx.showToast({ title: e.message || '操作失败', icon: 'none', duration: 2500 }); }
function refresh(page, work) {
  try { work(snapshot()); page.setData({ error: '' }); }
  catch (e) {
    if (e.message === '请先选择演示账号') wx.reLaunch({ url: '/pages/auth/login/index' });
    else { page.setData({ error: e.message }); error(e); }
  }
}
function act(page, work, success = '操作已保存') {
  if (page.data.busy) return;
  page.setData({ busy: true });
  try { work(); if (success) wx.showToast({ title: success, icon: 'success' }); }
  catch (e) { error(e); }
  finally { page.setData({ busy: false }); }
}
function input(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }); }
function go(e) {
  const url = e.currentTarget.dataset.url;
  if (e.currentTarget.dataset.tab) wx.switchTab({ url }); else wx.navigateTo({ url });
}
function requestId() { return Date.now() + '-' + Math.random().toString(36).slice(2); }
module.exports = { services, snapshot, refresh, act, input, go, requestId, error, labels };

