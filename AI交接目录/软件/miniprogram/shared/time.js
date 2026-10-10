const { requireThat } = require('./errors');
function parseTime(value) {
  requireThat(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value), '时间格式应为 YYYY-MM-DD HH:mm');
  const result = Date.parse(value.replace(' ', 'T') + ':00+08:00');
  requireThat(Number.isFinite(result), '时间无效');
  requireThat(formatTime(result) === value, '日期或时间不存在');
  return result;
}
function formatTime(value) {
  return new Date(value + 8 * 3600000).toISOString().slice(0, 16).replace('T', ' ');
}
function today(value = Date.now()) { return formatTime(value).slice(0, 10); }
function overlaps(a, b) { return a.start < b.end && b.start < a.end; }
module.exports = { parseTime, formatTime, today, overlaps };

