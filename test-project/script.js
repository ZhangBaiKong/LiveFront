// LiveFront 测试脚本
console.log('Hello from test-project!');

const btn = document.getElementById('clickBtn');
let count = 0;

if (btn) {
  btn.addEventListener('click', () => {
    count++;
    btn.textContent = `已点击 ${count} 次`;
    console.log(`Button clicked: ${count}`);
  });
}

// 暴露给 window 方便测试
window.testProject = {
  version: '1.0.0',
  name: 'LiveFront Test Project',
  getCount: () => count
};