function audit(state, user, action, targetId, detail, now) {
  state.logs.unshift({ id: 'log-' + state.nextId++, userId: user.id, userName: user.name, action, targetId, detail, at: now });
}
function notify(state, userId, title, bookingId, now) {
  state.notifications.unshift({ id: 'notice-' + state.nextId++, userId, title, bookingId, at: now, read: false });
}
module.exports = { audit, notify };

