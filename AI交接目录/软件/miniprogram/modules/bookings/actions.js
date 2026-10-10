const { requireThat } = require('../../shared/errors');
const { actor, canApprove, requireTraining } = require('../auth/policy');
const { audit, notify } = require('../audit/events');
const { assertSlot, expirePending } = require('./rules');
function transition(state, id, action, input, now) {
  const user = actor(state);
  expirePending(state, now);
  const b = state.bookings.find(item => item.id === id);
  requireThat(b, '预约不存在');
  requireThat(b.version === input.version, '记录已变化，请刷新后重试');
  const instrument = state.instruments.find(i => i.id === b.instrumentId);
  const lab = state.labs.find(l => l.id === b.labId);
  const owner = b.userId === user.id;
  const manager = canApprove(user, b.labId);
  const before = b.status;
  if (action === 'approve' || action === 'reject') {
    requireThat(manager, '没有该实验室的审批权限');
    requireThat(b.status === 'pending' && b.start > now, '该申请已处理或已过期');
    if (action === 'approve') {
      requireThat(instrument.status === 'active' && lab.status === 'active', '仪器或实验室不可用');
      const applicant = state.users.find(u => u.id === b.userId);
      requireThat(applicant && applicant.enabled, '申请账号已停用');
      const { requireLab } = require('../auth/policy');
      requireLab(applicant, b.labId);
      requireTraining(state, applicant, instrument, now);
      assertSlot(state, instrument.id, b, b.id);
      b.status = 'approved';
    } else {
      requireThat(input.reason && input.reason.trim(), '驳回原因必填');
      b.status = 'rejected'; b.reason = input.reason.trim().slice(0, 300);
    }
  } else if (action === 'cancel') {
    requireThat(owner || user.role === 'admin', '不能取消他人的预约');
    requireThat(['pending', 'approved'].includes(b.status) && b.start > now, '仅可取消尚未开始的预约');
    b.status = 'cancelled';
  } else if (action === 'checkin') {
    requireThat(owner, '只能为本人签到');
    requireThat(b.status === 'approved', '当前状态不能签到');
    requireThat(now >= b.start && now < b.end, '请在预约时段内签到');
    requireThat(instrument.status === 'active' && lab.status === 'active', '仪器或实验室不可用');
    const { requireLab } = require('../auth/policy');
    requireLab(user, b.labId); requireTraining(state, user, instrument, now);
    requireThat(!state.bookings.some(x => x.id !== b.id && x.instrumentId === b.instrumentId && ['active', 'awaiting_return'].includes(x.status)), '上一位尚未完成归还确认');
    b.status = 'active'; b.actualStart = now;
  } else if (action === 'finish') {
    requireThat(owner && b.status === 'active', '只有使用人可以结束进行中的预约');
    b.status = 'awaiting_return'; b.actualEnd = now;
  } else if (action === 'return') {
    requireThat(manager && b.status === 'awaiting_return', '没有归还权限或尚未提交结束');
    b.status = 'completed'; b.confirmedAt = now;
  } else {
    requireThat(false, '不支持的预约操作');
  }
  b.version += 1;
  audit(state, user, action, b.id, { before, after: b.status, reason: b.reason || '' }, now);
  notify(state, b.userId, '预约状态已更新', b.id, now);
  return b;
}
module.exports = { transition };

