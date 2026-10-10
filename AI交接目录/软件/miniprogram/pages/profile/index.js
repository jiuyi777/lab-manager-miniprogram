const v = require('../../shared/view');
Page({
  data: {},
  onShow() { v.refresh(this, s => this.setData({ user: s.user, role: s.roleLabel, canManage: s.canManage })); },
  go: v.go,
  logout() { wx.showModal({ title: '更换演示账号', content: '当前设备记录会保留，可切换为老师或管理员继续审批。', success: r => {
    if (r.confirm) v.act(this, () => { v.services().logout(); wx.reLaunch({ url: '/pages/auth/login/index' }); }, '');
  } }); }
});

