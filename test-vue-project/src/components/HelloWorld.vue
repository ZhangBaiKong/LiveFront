<template>
  <div style="border: 2px solid #42b883; border-radius: 12px; padding: 20px; margin-top: 16px;">
    <h3 style="color: #42b883; margin-top: 0;">{{ msg }}</h3>
    <p>这是一个 Vue 子组件，编译后正常渲染。</p>
    <button
      @click="count++"
      style="padding: 10px 24px; background: #42b883; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;"
    >
      点击了 {{ count }} 次
    </button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  props: ['msg'],
  setup() {
    const count = ref(0)
    return { count }
  }
}
</script>
