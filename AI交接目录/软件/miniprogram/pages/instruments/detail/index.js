const v = require('../../../shared/view');
const { formatTime } = require('../../../shared/time');
Page({
  data: {},
  onLoad(o) { this.id = o.id; },
  onShow() { v.refresh(this, s => {
    const item = s.instruments.find(i => i.id === this.id);
    if (!item) throw new Error('仪器不存在或无权查看');
    this.setData({ item, slots: s.calendar.filter(b => b.instrumentId === this.id && ['pending', 'approved', 'active', 'awaiting_return'].includes(b.status)).map(b => ({ id: b.id, text: formatTime(b.start) + ' 至 ' + formatTime(b.end), label: v.labels[b.status] })) });
  }); },
  go: v.go
});

