const fs = require('fs');
const f = 'src/renderer/modules/git/git.js';
let s = fs.readFileSync(f, 'utf8');
const reps = [
  [/\/\/ 濡傛灉鏆傚瓨鍖烘湁锛岀敤鏆傚瓨鍖虹殑diff鍋氬弬鑰/g, '// 如果暂存区有，用暂存区的 diff 做参考'],
  [/\/\/ 灏濊瘯浠 git show 鑾峰彇鍘熷鍐呭/g, '// 尝试从 git show 获取原始内容'],
  [/\/\/ 濡傛灉鏂囦欢鏄澧炵殑锛屽師濮嬪唴瀹逛负绌/g, '// 如果文件是新增的，原始内容为空'],
  [/\/\/ 灏濊瘯閫氳繃 git show 鑾峰彇 HEAD/g, '// 尝试通过 git show 获取 HEAD 版本'],
  [/\/\/ 鐢 diff 鐨勬柟寮忓洖鎺ㄥ師濮嬪唴瀹/g, '// 用 diff 的方式回推原始内容——简单实现：显示 diff 文本'],
  [/\/\/ 绠€鍖栨柟妗堬細鐩存帴鐢ㄥ師濮嬫枃浠跺拰褰撳墠鏂囦欢鍋氬/g, '// 简化方案：直接用原始文件和当前文件做对比'],
  [/\/\/ 瀵逛簬闈炴柊澧炴枃浠讹紝灏濊瘯浣跨敤鏆傚瓨鍖 diff/g, '// 对于非新增文件，尝试使用暂存区 diff 来构建原始视图'],
  [/\/\/ 涓轰簡绠€鍗曞拰鍙潬锛岀洿鎺ュ睍绀哄綋鍓嶆枃浠/g, '// 为了简单和可靠，直接展示当前文件 vs diff 信息'],
  [/'<div style="padding:20px;color:var(--text-muted);">鏃犳硶鍔犺浇 Diff 瑙嗗浘: ' \+ e\.message \+ '<\/div>'/g, '\'<div style="padding:20px;color:var(--text-muted);">无法加载 Diff 视图: \' + e.message + \'</div>\'']
];
for (const [r, t] of reps) s = s.replace(r, t);
fs.writeFileSync(f, s, 'utf8');
console.log('updated');
