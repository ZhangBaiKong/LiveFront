<template>
  <div style="padding: 40px; font-family: system-ui;">
    <h1 style="color: #42b883;">Vue 在 LiveFront 中运行</h1>
    <p>这个项目使用 .vue 单文件组件，LiveFront 自动编译并实时预览。</p>
    <HelloWorld msg="LiveFront + Vue" />
    <TodoList />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import TodoList from './components/TodoList.vue'

export default {
  components: { HelloWorld, TodoList }
}
</script>
