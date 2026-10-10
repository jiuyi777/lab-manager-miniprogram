const v = require('../../../shared/view');
Page({
  data: { filter: '全部', filters: ['全部', '待审批', '已通过', '使用中', '待确认归还', '已完成', '已取消', '已驳回', '申请已过期'] },
  onShow() { v.refresh(this, s => { this.all = s.bookings; this.updateList(); }); },
  choose(e) { this.setData({ filter: e.currentTarget.dataset.value }); this.updateList(); },
  updateList() { this.setData({ items: (this.all || []).filter(b => this.data.filter === '全部' || b.statusLabel === this.data.filter) }); },
  go: v.go
});

