const { requireThat } = require('../../shared/errors');
function actor(state) {
  const user = state.users.find(u => u.id === state.session);
  requireThat(user && user.enabled, '请先选择演示账号');
  return user;
}
function canAccess(user, labId) {
  return user.role === 'admin' || user.labs.includes(labId);
}
function canApprove(user, labId) {
  return user.role === 'admin' || (user.role === 'teacher' && user.labs.includes(labId));
}
function requireLab(user, labId) {
  requireThat(canAccess(user, labId), '没有该实验室的使用权限');
}
function requireTraining(state, user, instrument, now) {
  if (!instrument.requiresTraining) return;
  const grant = state.training.find(t => t.userId === user.id && t.instrumentId === instrument.id);
  requireThat(grant && grant.expiresAt > now, '该仪器培训未完成或资格已过期');
}
module.exports = { actor, canAccess, canApprove, requireLab, requireTraining };

