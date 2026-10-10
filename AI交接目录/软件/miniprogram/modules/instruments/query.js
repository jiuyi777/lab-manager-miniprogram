const { canAccess } = require('../auth/policy');
function listInstruments(state, user, labId = '') {
  return state.instruments.filter(i => canAccess(user, i.labId) && (!labId || i.labId === labId)).map(i => {
    const current = state.bookings.find(b => b.instrumentId === i.id && ['active', 'awaiting_return'].includes(b.status));
    return Object.assign({}, i, { stateLabel: i.status === 'maintenance' ? '维护中' : current ? '使用中' : i.status === 'active' ? '当前空闲' : '已停用' });
  });
}
module.exports = { listInstruments };

