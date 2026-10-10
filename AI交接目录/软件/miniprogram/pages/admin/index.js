const v = require('../../shared/view');
Page({
  data: { busy: false, form: { reason: '' } },
  onShow() { v.refresh(this, s => {
    if (!s.canManage) throw new Error('此入口仅供老师和管理员使用');
    this.setData({ allowed: true, role: s.roleLabel, pending: s.approvals.filter(b => b.status === 'pending'), returns: s.approvals.filter(b => b.status === 'awaiting_return') });
  }); },
  input: v.input,
  run(e) { const { id, action, version } = e.currentTarget.dataset;
    v.act(this, () => {
      v.services().bookingAction(id, action, { version: Number(version), reason: this.data.form.reason });
      this.setData({ 'form.reason': '' }); this.onShow();
    });
  }
});

