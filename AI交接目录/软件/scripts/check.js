const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const files = walk(path.join(root, 'miniprogram'));
const failures = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.js')) {
    try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); } catch (e) { failures.push(file + ': JS语法错误'); }
    if (source.split('\n').length > 300) failures.push(file + ': 超过300行，请按责任拆分');
    if (file.includes(path.sep + 'pages' + path.sep) && /require\([^)]*(?:modules|data)[/\\]/.test(source)) failures.push(file + ': 页面不能跨过services直接引用领域或存储');
  }
  if (file.endsWith('.json')) { try { JSON.parse(source); } catch { failures.push(file + ': JSON错误'); } }
  if (file.endsWith('.wxml')) {
    for (const expression of source.matchAll(/\{\{([\s\S]*?)\}\}/g)) if (/\.\w+\(/.test(expression[1])) failures.push(file + ': WXML不能调用JS方法');
    const controller = file.replace('.wxml', '.js');
    if (fs.existsSync(controller)) {
      const js = fs.readFileSync(controller, 'utf8');
      for (const event of source.matchAll(/(?:bind\w+|catch\w+)="([A-Za-z_]\w*)"/g)) {
        if (!(new RegExp('\\b' + event[1] + '\\s*(?:\\(|:)')).test(js)) failures.push(file + ': 缺少事件处理器 ' + event[1]);
      }
    }
  }
}
const app = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram/app.json')));
for (const route of app.pages) for (const ext of ['.js', '.json', '.wxml']) if (!fs.existsSync(path.join(root, 'miniprogram', route + ext))) failures.push('缺少页面文件 ' + route + ext);
for (const file of files.filter(f => f.endsWith('.wxml'))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const link of source.matchAll(/data-url="\/([^"?]+)(?:[^"]*)"/g)) if (!app.pages.includes(link[1])) failures.push('无效页面链接 ' + link[1]);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('静态检查通过：' + app.pages.length + '页；语法、路由、事件、文件长度与分层边界。');
console.log('此检查不替代微信开发者工具编译或真机运行。');

