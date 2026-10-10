const v = require('../../../shared/view');
Page({
  data: { users: [], selected: 'student', busy: false },
  onShow() { this.setData({ users: v.services().demoUsers() }); },
  choose(e) { this.setData({ selected: e.currentTarget.dataset.id }); },
  enter() { v.act(this, () => { v.services().login(this.data.selected); wx.switchTab({ url: '/pages/home/index' }); }, ''); }
});

