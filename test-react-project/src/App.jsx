import React, { useState } from 'react';
import Button from './components/Button';
import Card from './components/Card';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#4a6cf7' }}>React 在 LiveFront 中运行</h1>
      <p>这个项目使用 JSX，LiveFront 自动编译并实时预览。</p>
      <Card title="计数器">
        <p>当前计数: {count}</p>
        <Button onClick={() => setCount(c => c + 1)}>点击 +1</Button>
      </Card>
      <Card title="组件嵌套">
        <p>子组件正确渲染说明编译和依赖解析正常。</p>
      </Card>
    </div>
  );
}

export default App;
