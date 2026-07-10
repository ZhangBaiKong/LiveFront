<template>
  <div style="margin-top: 20px;">
    <h3>待办事项 (Composition API + script setup)</h3>
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <input
        v-model="newTodo"
        @keyup.enter="addTodo"
        placeholder="输入待办事项..."
        style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;"
      />
      <button
        @click="addTodo"
        style="padding: 10px 20px; background: #42b883; color: white; border: none; border-radius: 8px; cursor: pointer;"
      >
        添加
      </button>
    </div>
    <ul style="list-style: none; padding: 0;">
      <li v-for="(todo, index) in todos" :key="index" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <span :style="{ textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? '#999' : '#333' }">
          {{ todo.text }}
        </span>
        <button @click="todos.splice(index, 1)" style="float: right; color: #e74c3c; background: none; border: none; cursor: pointer;">删除</button>
        <button @click="todo.done = !todo.done" style="float: right; margin-right: 8px; color: #42b883; background: none; border: none; cursor: pointer;">
          {{ todo.done ? '撤销' : '完成' }}
        </button>
      </li>
    </ul>
    <p v-if="todos.length === 0" style="color: #999; text-align: center;">暂无待办事项</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const newTodo = ref('')
const todos = ref([])

function addTodo() {
  if (newTodo.value.trim()) {
    todos.value.push({ text: newTodo.value.trim(), done: false })
    newTodo.value = ''
  }
}
</script>

<style scoped>
input:focus {
  outline: none;
  border-color: #42b883;
}
</style>
