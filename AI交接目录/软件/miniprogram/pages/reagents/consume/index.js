const v = require('../../../shared/view');
Page({
  data: { form: { quantity: '1', purpose: '' }, busy: false },
  onLoad(o) { this.id = o.id; this.requestId = v.requestId(); },
  onShow() { v.refresh(this, s => {
    const item = s.reagents.find(r => r.id === this.id); if (!item) throw new Error('试剂不存在或无权访问');
    this.setData({ item });
  }); },
  input: v.input,
  submit() { v.act(this, () => {
    v.services().consume({ id: this.id, quantity: Number(this.data.form.quantity), purpose: this.data.form.purpose, requestId: this.requestId });
    wx.navigateBack();
  }, '领用已保存'); }
});

