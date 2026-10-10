const v = require('../../shared/view');
const { today } = require('../../shared/time');
Page({
  data: {},
  onShow() { v.refresh(this, s => {
    const labs = s.labs.map(l => {
      const items = s.instruments.filter(i => i.labId === l.id);
      return Object.assign({}, l, { total: items.length, free: items.filter(i => i.stateLabel === '当前空闲').length, using: items.filter(i => i.stateLabel === '使用中').length, maintenance: items.filter(i => i.status === 'maintenance').length });
    });
    this.setData({ user: s.user, labs, today: today(s.now), bookings: s.bookings.filter(b => b.startText.startsWith(today(s.now))).slice(0, 2), canManage: s.canManage, unread: s.notifications.filter(n => !n.read).length });
  }); },
  go: v.go
});

