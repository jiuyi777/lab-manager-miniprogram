const v = require('../../shared/view');
const { formatTime } = require('../../shared/time');
Page({
  data: {},
  onShow() { v.refresh(this, s => this.setData({ items: s.notifications.map(n => Object.assign({}, n, { atText: formatTime(n.at) })) })); },
  read(e) { v.act(this, () => { v.services().readNotice(e.currentTarget.dataset.id); this.onShow(); }, '已读'); }
});

