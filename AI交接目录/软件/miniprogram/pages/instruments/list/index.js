const v = require('../../../shared/view');
Page({
  data: { labId: '', keyword: '', filter: '全部', items: [], all: [], filters: ['全部', '当前空闲', '使用中', '维护中'] },
  onLoad(o) { this.setData({ labId: o.lab || '' }); },
  onShow() { v.refresh(this, s => { this.setData({ all: s.instruments.filter(i => !this.data.labId || i.labId === this.data.labId) }); this.filterItems(); }); },
  search(e) { this.setData({ keyword: e.detail.value }); this.filterItems(); },
  choose(e) { this.setData({ filter: e.currentTarget.dataset.value }); this.filterItems(); },
  filterItems() { this.setData({ items: this.data.all.filter(i => (i.name + i.id).includes(this.data.keyword) && (this.data.filter === '全部' || i.stateLabel === this.data.filter)) }); },
  go: v.go
});

