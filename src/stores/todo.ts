import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TodoItem } from '@/types/todo'

// 调试模式：支持模拟日期
const DEBUG_DATE = localStorage.getItem('debug_date')
const getNow = () => {
  if (DEBUG_DATE) {
    return new Date(DEBUG_DATE)
  }
  return new Date()
}

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<TodoItem[]>([])

  // 获取指定日期的 todo 列表
  const getTodosByDate = (date: string) => {
    return todos.value.filter(t => t.createdAt === date)
  }

  // 获取今日的 todo 列表（未完成的会从昨天继承）
  const todayTodos = computed(() => {
    const today = getNow().toISOString().split('T')[0]
    return getTodosByDate(today)
  })

  // 获取当前日期（支持调试模式）
  function getCurrentDate(): string {
    return getNow().toISOString().split('T')[0]
  }

  // 初始化 - 从 localStorage 恢复，并处理跨日未完成任务
  function init() {
    const saved = localStorage.getItem('mood_app_todos')
    if (saved) {
      try {
        todos.value = JSON.parse(saved)
      } catch {
        todos.value = []
      }
    }
    
    // 处理跨日：将昨天的未完成任务移到今天
    transferYesterdayTodos()
  }

  // 将昨天的未完成任务转移到今天
  function transferYesterdayTodos() {
    const today = getCurrentDate()
    const yesterday = new Date(getNow().getTime() - 86400000).toISOString().split('T')[0]
    
    const yesterdayTodos = todos.value.filter(t => t.createdAt === yesterday && !t.completed)
    
    if (yesterdayTodos.length > 0) {
      // 更新创建日期为今天
      yesterdayTodos.forEach(todo => {
        todo.createdAt = today
      })
      save()
    }
  }

  // 保存到 localStorage
  function save() {
    localStorage.setItem('mood_app_todos', JSON.stringify(todos.value))
  }

  // 添加 todo
  function addTodo(text: string) {
    if (!text.trim()) return

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: getCurrentDate()
    }
    todos.value.push(todo)
    save()
  }

  // 添加已完成的 todo（用于历史日记补录）
  function addTodoAsCompleted(text: string, date: string) {
    if (!text.trim()) return

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: true,
      createdAt: date
    }
    todos.value.push(todo)
    save()
  }

  // 切换完成状态
  function toggleTodo(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
      save()
    }
  }

  // 删除 todo
  function deleteTodo(id: string) {
    const index = todos.value.findIndex(t => t.id === id)
    if (index !== -1) {
      todos.value.splice(index, 1)
      save()
    }
  }

  // 清除指定日期的已完成 todo
  function clearCompletedByDate(date: string) {
    todos.value = todos.value.filter(t => !(t.createdAt === date && t.completed))
    save()
  }

  // 清除今日已完成
  function clearCompleted() {
    clearCompletedByDate(getCurrentDate())
  }

  // 清除所有数据（退出登录）
  function clearData() {
    todos.value = []
  }

  return {
    todos,
    todayTodos,
    init,
    getTodosByDate,
    addTodo,
    addTodoAsCompleted,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    clearCompletedByDate,
    clearData
  }
})
