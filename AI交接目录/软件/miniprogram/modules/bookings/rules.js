const { requireThat } = require('../../shared/errors');
const { overlaps, formatTime } = require('../../shared/time');
const { requireLab, requireTraining } = require('../auth/policy');
const HOLD = ['pending', 'approved', 'active', 'awaiting_return'];
function validateResource(state, user, instrument, start, end, now) {
  requireThat(instrument, '仪器不存在');
  const lab = state.labs.find(l => l.id === instrument.labId);
  requireThat(lab && lab.status === 'active', '实验室暂未开放');
  requireThat(lab.capabilities.includes('booking'), '该实验室未开放仪器预约功能');
  requireLab(user, lab.id);
  requireThat(instrument.status === 'active', '仪器维护或停用中');
  requireTraining(state, user, instrument, now);
  requireThat(start < end, '结束时间必须晚于开始时间');
  requireThat(start >= now, '不能预约已开始的时段');
  const a = formatTime(start), b = formatTime(end);
  requireThat(a.slice(0, 10) === b.slice(0, 10), '首版暂不支持跨日预约');
  requireThat(a.slice(11) >= lab.open && b.slice(11) <= lab.close, '预约超出实验室开放时段');
}
function assertSlot(state, instrumentId, range, excludeId) {
  const blocked = state.bookings.some(b => b.id !== excludeId && b.instrumentId === instrumentId && HOLD.includes(b.status) && overlaps(b, range));
  requireThat(!blocked, '该时段已被占用，请重新选择');
}
function expirePending(state, now) {
  state.bookings.forEach(b => {
    if (b.status === 'pending' && b.start <= now) {
      b.status = 'expired'; b.version += 1; b.expiredAt = now;
    }
  });
}
module.exports = { HOLD, validateResource, assertSlot, expirePending };
