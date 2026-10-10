const v = require('../../../shared/view');
const { formatTime, today } = require('../../../shared/time');
Page({
  data: {},
  onShow() { v.refresh(this, s => this.setData({
    items: s.reagents.map(r => Object.assign({}, r, { expired: r.expiry < today(s.now), low: r.stock < r.threshold })),
    logs: s.reagentLogs.slice(0, 10).map(l => Object.assign({}, l, { atText: formatTime(l.at) }))
  })); },
  go: v.go
});

