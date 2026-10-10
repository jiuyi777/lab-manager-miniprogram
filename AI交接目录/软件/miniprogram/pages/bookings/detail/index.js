const v = require('../../../shared/view');
Page({
  data: { busy: false },
  onLoad(o) { this.id = o.id; },
  onShow() { v.refresh(this, s => {
    const item = s.bookings.find(b => b.id === this.id);
    if (!item) throw new Error('预约不存在或无权查看');
    this.setData({ item });
  }); },
  run(e) {
    const action = e.currentTarget.dataset.action;
    const execute = () => v.act(this, () => {
      v.services().bookingAction(this.id, action, { version: this.data.item.version }); this.onShow();
    });
    if (action === 'cancel' || action === 'finish') wx.showModal({ title: action === 'cancel' ? '取消预约？' : '确认结束使用？', content: action === 'finish' ? '记录实际结束时间，随后等待管理员归还确认。' : '取消后将释放预约时段。', success: r => { if (r.confirm) execute(); } });
    else execute();
  }
});

