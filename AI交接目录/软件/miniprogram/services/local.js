const { actor, canApprove, canAccess } = require('../modules/auth/policy');
const { createBooking } = require('../modules/bookings/create');
const { transition } = require('../modules/bookings/actions');
const { expirePending } = require('../modules/bookings/rules');
const { consume } = require('../modules/reagents/service');
const { saveSample } = require('../modules/samples/service');
const { listInstruments } = require('../modules/instruments/query');
const { requireThat } = require('../shared/errors');
function createLocalServices(store, now = Date.now) {
  return {
    mode: 'local-demo',
    demoUsers: () => store.read().users.filter(u => u.enabled),
    login: id => store.transact(s => {
      requireThat(s.users.some(u => u.id === id && u.enabled), '演示账号不存在');
      s.session = id; return actor(s);
    }),
    logout: () => store.transact(s => { s.session = null; }),
    snapshot: () => {
      store.transact(s => expirePending(s, now()));
      const s = store.read(), user = actor(s);
      const mine = s.bookings.filter(b => b.userId === user.id);
      const review = s.bookings.filter(b => canApprove(user, b.labId));
      return {
        user, now: now(), labs: s.labs.filter(l => canAccess(user, l.id)),
        instruments: listInstruments(s, user), bookings: mine, approvals: review,
        // Calendar contains only time/status, not other users' names or sample details.
        calendar: s.bookings.filter(b => canAccess(user, b.labId)).map(b => ({
          id: b.id, instrumentId: b.instrumentId, start: b.start, end: b.end, status: b.status
        })),
        reagents: s.reagents.filter(r => canAccess(user, r.labId)),
        reagentLogs: s.reagentLogs.filter(r => r.userId === user.id || user.role === 'admin'),
        samples: s.samples.filter(x => x.userId === user.id),
        notifications: s.notifications.filter(n => n.userId === user.id),
        logs: user.role === 'admin' ? s.logs : []
      };
    },
    createBooking: input => store.transact(s => createBooking(s, input, now())),
    bookingAction: (id, action, input) => store.transact(s => transition(s, id, action, input, now())),
    consume: input => store.transact(s => consume(s, input, now())),
    saveSample: input => store.transact(s => saveSample(s, input, now())),
    readNotice: id => store.transact(s => {
      const user = actor(s), n = s.notifications.find(x => x.id === id && x.userId === user.id);
      requireThat(n, '通知不存在'); n.read = true;
    })
  };
}
module.exports = { createLocalServices };

