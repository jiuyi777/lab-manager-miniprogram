const v = require('../../shared/view');
Page({
  data: { editing: false, form: { name: '', composition: '', process: '', tests: [] }, tests: ['SEM', 'XRD', 'FTIR'], busy: false },
  onShow() { v.refresh(this, s => this.setData({ items: s.samples })); },
  toggle() { this.setData({ editing: !this.data.editing }); },
  input: v.input,
  chooseTests(e) { this.setData({ 'form.tests': e.detail.value }); },
  save() { v.act(this, () => {
    v.services().saveSample(this.data.form);
    this.setData({ editing: false, form: { name: '', composition: '', process: '', tests: [] } }); this.onShow();
  }); }
});

