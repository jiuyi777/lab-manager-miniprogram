const v = require('../../../shared/view');
const { today } = require('../../../shared/time');
Page({
  data: { form: { date: '', start: '08:00', end: '10:00', purpose: '' }, samples: [], sampleIndex: 0, busy: false },
  onLoad(o) { this.id = o.id; this.requestId = v.requestId(); this.setData({ 'form.date': today(Date.now() + 86400000) }); },
  onShow() { v.refresh(this, s => {
    const item = s.instruments.find(i => i.id === this.id); if (!item) throw new Error('仪器不存在');
    this.setData({ item, samples: [{ id: '', name: '不关联样品' }].concat(s.samples) });
  }); },
  input: v.input,
  chooseSample(e) { this.setData({ sampleIndex: Number(e.detail.value) }); },
  submit() { v.act(this, () => {
    const f = this.data.form;
    const result = v.services().createBooking({ requestId: this.requestId, instrumentId: this.id, start: f.date + ' ' + f.start, end: f.date + ' ' + f.end, purpose: f.purpose, sampleId: this.data.samples[this.data.sampleIndex].id });
    wx.redirectTo({ url: '/pages/bookings/detail/index?id=' + result.id });
  }, '预约已保存'); }
});

