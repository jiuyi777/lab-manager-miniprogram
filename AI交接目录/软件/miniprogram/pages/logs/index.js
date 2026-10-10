const v = require('../../shared/view');
const { formatTime } = require('../../shared/time');
Page({
  data: {},
  onShow() { v.refresh(this, s => {
    if (s.user.role !== 'admin') throw new Error('没有操作日志权限');
    this.setData({ items: s.logs.map(l => Object.assign({}, l, { atText: formatTime(l.at), detailText: JSON.stringify(l.detail) })) });
  }); }
});

