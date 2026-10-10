const { requireThat } = require('../../shared/errors');
const { parseTime } = require('../../shared/time');
const { actor, canApprove } = require('../auth/policy');
const { audit, notify } = require('../audit/events');
const { validateResource, assertSlot, expirePending } = require('./rules');
function createBooking(state, input, now) {
  const user = actor(state);
  requireThat(typeof input.requestId === 'string' && input.requestId.length > 0, '缺少提交编号');
  const previous = state.requestKeys.find(k => k.userId === user.id && k.key === input.requestId && k.type === 'booking');
  if (previous) return state.bookings.find(b => b.id === previous.id);
  expirePending(state, now);
  const instrument = state.instruments.find(i => i.id === input.instrumentId);
  const start = parseTime(input.start), end = parseTime(input.end);
  validateResource(state, user, instrument, start, end, now);
  requireThat(typeof input.purpose === 'string' && input.purpose.trim().length > 0, '请填写用途');
  requireThat(input.purpose.trim().length <= 300, '用途不能超过300字');
  if (input.sampleId) requireThat(state.samples.some(s => s.id === input.sampleId && s.userId === user.id), '只能关联自己的样品');
  assertSlot(state, instrument.id, { start, end });
  const approved = !instrument.needsApproval || canApprove(user, instrument.labId);
  const booking = {
    id: 'B-' + state.nextId++, userId: user.id, userName: user.name,
    instrumentId: instrument.id, labId: instrument.labId, start, end,
    purpose: input.purpose.trim(), sampleId: input.sampleId || '',
    status: approved ? 'approved' : 'pending', version: 1, createdAt: now
  };
  state.bookings.unshift(booking);
  state.requestKeys.push({ userId: user.id, key: input.requestId, type: 'booking', id: booking.id });
  audit(state, user, '提交预约', booking.id, { status: booking.status }, now);
  notify(state, user.id, approved ? '预约已通过' : '预约待审批', booking.id, now);
  return booking;
}
module.exports = { createBooking };

