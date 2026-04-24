<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useAuthStore } from '@/stores/auth'
import { useTodoStore } from '@/stores/todo'
import { moodConfig, moodMapping, type MoodTag } from '@/types/diary'

const router = useRouter()
const store = useDiaryStore()
const authStore = useAuthStore()
const todoStore = useTodoStore()
const isDark = ref(false)
const showLogoutConfirm = ref(false)
const isInitialLoading = ref(true)
const isUploadingAvatar = ref(false)
const avatarInputRef = ref<HTMLInputElement | null>(null)
const newTodoText = ref('')

// 切换深色模式
const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// 退出登录
function handleLogout() {
  showLogoutConfirm.value = true
}

function confirmLogout() {
  authStore.logout()
  store.clearData()
  todoStore.clearData()
  router.push('/login')
}

// 加载日记数据
async function loadDiaries() {
  if (authStore.isAuthenticated) {
    isInitialLoading.value = true
    await store.loadFromServer()
    isInitialLoading.value = false
  }
}

// 问候语
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好，今天也要开心哦'
  if (hour < 18) return '下午好，辛苦了'
  return '晚上好，好好休息'
}

// 获取分数颜色
function getScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  if (score >= 30) return 'text-orange-500'
  return 'text-red-500'
}

// 获取心情背景样式
function getMoodBgClass(mood: MoodTag) {
  const classes: Record<MoodTag, string> = {
    sad: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    anxious: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    calm: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    happy: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    angry: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  }
  return classes[mood]
}

// 获取有效的 MoodTag（从字符串转换）
function getMoodTag(mood: string): MoodTag {
  return moodMapping[mood] || 'calm'
}

onMounted(() => {
  // 恢复主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  
  // 初始化 Todo
  todoStore.init()
  
  // 加载日记数据
  loadDiaries()
})

// 监听认证状态变化
watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    loadDiaries()
  }
})

// 头像上传
function triggerAvatarUpload() {
  avatarInputRef.value?.click()
}

async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 验证文件类型和大小
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB')
    return
  }

  isUploadingAvatar.value = true

  try {
    // 转换为 Base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      const success = await authStore.updateAvatar(base64)
      if (!success) {
        alert('头像上传失败，请重试')
      }
    }
    reader.readAsDataURL(file)
  } finally {
    isUploadingAvatar.value = false
    target.value = '' // 清空输入，允许重复选择同一文件
  }
}

// 日历相关
const currentDate = ref(new Date())
const calendarYear = computed(() => currentDate.value.getFullYear())
const calendarMonth = computed(() => currentDate.value.getMonth())

// 构建日历数据：返回6行7列的日期数组
const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month, 1).getDay() // 第一天是周几
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  // 构建 date => score 映射
  const scoreMap: Record<string, number> = {}
  store.diaries.forEach(d => {
    if (d.date && d.score !== undefined) {
      scoreMap[d.date] = d.score
    }
  })

  const days: { date: number; currentMonth: boolean; score?: number; dateStr: string }[] = []

  // 上月填充
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const m = month === 0 ? 12 : month
    const y = month === 0 ? year - 1 : year
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date: d, currentMonth: false, score: scoreMap[dateStr], dateStr })
  }

  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date: d, currentMonth: true, score: scoreMap[dateStr], dateStr })
  }

  // 下月填充（补齐6行）
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 1 : month + 2
    const y = month === 11 ? year + 1 : year
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date: d, currentMonth: false, score: scoreMap[dateStr], dateStr })
  }

  return days
})

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function prevMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
}

function nextMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
}

function isToday(day: { date: number; currentMonth: boolean; dateStr: string }) {
  const today = new Date().toISOString().split('T')[0]
  return day.currentMonth && day.dateStr === today
}

// 评分对应的背景颜色 - 圆形背景
function getScoreBgStyle(score?: number) {
  if (score === undefined) return ''
  if (score >= 70) return 'background-color: rgb(16 185 129 / 0.25)'
  if (score >= 50) return 'background-color: rgb(245 158 11 / 0.25)'
  if (score >= 30) return 'background-color: rgb(249 115 22 / 0.25)'
  return 'background-color: rgb(239 68 68 / 0.25)'
}

// Todo 功能
function addTodo() {
  if (newTodoText.value.trim()) {
    todoStore.addTodo(newTodoText.value)
    newTodoText.value = ''
  }
}

function handleTodoKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    addTodo()
  }
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <h1 class="text-lg font-semibold text-gray-800 dark:text-white">情绪日记</h1>
        <div class="flex items-center gap-2">
          <button 
            @click="handleLogout"
            class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            title="退出登录"
          >
            🚪
          </button>
          <button 
            @click="toggleDark"
            class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span v-if="isDark" class="text-xl">☀️</span>
            <span v-else class="text-xl">🌙</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- 欢迎卡片 -->
      <div class="card p-5 mb-5 animate-fade-in">
        <div class="flex items-center gap-4">
          <!-- 头像区域 -->
          <div 
            class="relative w-14 h-14 rounded-full cursor-pointer group overflow-hidden flex-shrink-0 ring-2 ring-pink-100 dark:ring-pink-900/50"
            @click="triggerAvatarUpload"
            :class="{ 'opacity-50': isUploadingAvatar }"
          >
            <img 
              v-if="authStore.user?.avatar"
              :src="authStore.user.avatar" 
              alt="用户头像"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div 
              v-else 
              class="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-2xl"
            >
              🌸
            </div>
            <!-- 上传遮罩层 -->
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <span class="text-white text-sm">📷</span>
            </div>
            <!-- 上传中动画 -->
            <div v-if="isUploadingAvatar" class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <!-- 隐藏的文件输入 -->
          <input 
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarChange"
          />
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-medium text-gray-800 dark:text-white truncate">
              {{ getGreeting() }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-0.5 truncate">
              记录今天的心情，让AI陪你一起疗愈
            </p>
          </div>
        </div>
      </div>

      <!-- 今日状态 - 骨架屏 -->
      <div class="card p-5 mb-5 animate-slide-up">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">今日心情</h3>
        
        <!-- 加载骨架屏 -->
        <div v-if="isInitialLoading" class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full skeleton"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-20 skeleton rounded"></div>
              <div class="h-3 w-16 skeleton rounded"></div>
            </div>
            <div class="w-16 h-16 rounded-full skeleton"></div>
          </div>
          <div class="h-3 w-full skeleton rounded"></div>
          <div class="h-3 w-3/4 skeleton rounded"></div>
        </div>
        
        <div v-else-if="store.todayDiary" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ moodConfig[getMoodTag(store.todayDiary.moodTag)].emoji }}</span>
              <div>
                <p class="font-medium text-gray-800 dark:text-white">
                  {{ moodConfig[getMoodTag(store.todayDiary.moodTag)].label }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">情绪分数 {{ store.todayDiary.score }}</p>
              </div>
            </div>
            <div class="w-18 h-18 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-sm">
              <div 
                class="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-500 bg-white/50 dark:bg-gray-800/50"
                :class="getScoreColor(store.todayDiary.score)"
              >
                {{ store.todayDiary.score }}
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
            {{ store.todayDiary.aiAnalyze || store.todayDiary.content }}
          </p>
          <button 
            @click="router.push(`/detail/${store.todayDiary._id}`)"
            class="text-sm text-pink-500 hover:text-pink-600 transition-colors font-medium"
          >
            查看详情 →
          </button>
        </div>
        
        <div v-else class="text-center py-6">
          <div class="text-4xl mb-3">📝</div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">今天还没有记录心情哦</p>
          <button @click="router.push('/editor')" class="btn-primary">
            开始记录
          </button>
        </div>
      </div>

      <!-- 每日 Todo -->
      <div class="card p-5 mb-5 animate-slide-up" style="animation-delay: 100ms">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">今日待办</h3>
          <span v-if="todoStore.todayTodos.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-500">
            {{ todoStore.todayTodos.filter(t => t.completed).length }}/{{ todoStore.todayTodos.length }}
          </span>
        </div>
        
        <!-- 添加 Todo 输入框 -->
        <div class="flex gap-2 mb-3">
          <input
            v-model="newTodoText"
            @keydown="handleTodoKeydown"
            type="text"
            class="input-field flex-1 text-sm py-2.5"
            placeholder="添加新任务..."
          />
          <button 
            @click="addTodo"
            class="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            +
          </button>
        </div>
        
        <!-- Todo 列表 -->
        <div v-if="todoStore.todayTodos.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
          <div 
            v-for="(todo, index) in todoStore.todayTodos" 
            :key="todo.id"
            class="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group stagger-item"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <button 
              @click="todoStore.toggleTodo(todo.id)"
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
              :class="todo.completed 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-gray-300 dark:border-gray-500 hover:border-pink-400'"
            >
              <span v-if="todo.completed" class="text-xs">✓</span>
            </button>
            <span 
              class="flex-1 text-sm truncate"
              :class="todo.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'"
            >
              {{ todo.text }}
            </span>
            <button 
              @click="todoStore.deleteTodo(todo.id)"
              class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
        
        <div v-else class="text-center py-4">
          <p class="text-gray-400 dark:text-gray-500 text-sm">还没有待办事项</p>
        </div>
        
        <!-- 清除已完成按钮 -->
        <button 
          v-if="todoStore.todayTodos.some(t => t.completed)"
          @click="todoStore.clearCompleted"
          class="mt-2 text-xs text-gray-400 hover:text-gray-500 transition-colors"
        >
          清除已完成
        </button>
      </div>

      <!-- 统计概览 -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="card p-4 text-center animate-slide-up" style="animation-delay: 150ms">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">日记总数</p>
          <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ store.diaries.length }}</p>
        </div>
        <div class="card p-4 text-center animate-slide-up" style="animation-delay: 200ms">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">平均情绪</p>
          <p class="text-2xl font-bold" :class="getScoreColor(store.avgMoodScore)">
            {{ store.avgMoodScore }}
          </p>
        </div>
      </div>

      <!-- 最近日记 -->
      <div class="card p-5 animate-slide-up mb-4" style="animation-delay: 250ms">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-gray-800 dark:text-white">最近日记</h3>
          <button 
            @click="router.push('/history')"
            class="text-sm text-pink-500 hover:text-pink-600 transition-colors font-medium"
          >
            查看全部
          </button>
        </div>
        
        <!-- 加载骨架屏 -->
        <div v-if="isInitialLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full skeleton"></div>
              <div class="h-3 w-20 skeleton rounded"></div>
            </div>
            <div class="h-3 w-full skeleton rounded"></div>
            <div class="h-3 w-2/3 skeleton rounded"></div>
          </div>
        </div>
        
        <div v-else-if="store.sortedDiaries.length > 0" class="space-y-3">
          <div 
            v-for="(diary, index) in store.sortedDiaries.slice(0, 3)" 
            :key="diary._id"
            @click="router.push(`/detail/${diary._id}`)"
            class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer card-hover stagger-item"
            :style="{ animationDelay: `${index * 80}ms` }"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ moodConfig[getMoodTag(diary.moodTag)].emoji }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ diary.date }}</span>
              </div>
              <span class="text-xs px-2.5 py-1 rounded-full font-medium" :class="getMoodBgClass(getMoodTag(diary.moodTag))">
                {{ moodConfig[getMoodTag(diary.moodTag)].label }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {{ diary.content }}
            </p>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <div class="text-5xl mb-3">📖</div>
          <p class="text-gray-400 dark:text-gray-500">还没有日记</p>
          <button @click="router.push('/editor')" class="btn-secondary mt-4">
            写第一篇日记
          </button>
        </div>
      </div>

      <!-- 情绪日历 -->
      <div class="card p-5 mb-5 animate-slide-up" style="animation-delay: 50ms">
        <div class="flex items-center justify-between mb-4">
          <button @click="prevMonth" class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 text-lg">
            ‹
          </button>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white tracking-wide">
            {{ calendarYear }}年 {{ calendarMonth + 1 }}月
          </h3>
          <button @click="nextMonth" class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 text-lg">
            ›
          </button>
        </div>
        <!-- 星期标题 -->
        <div class="grid grid-cols-7 mb-2">
          <div v-for="(w, i) in weekDays" :key="i" class="text-center text-xs font-medium py-1"
            :class="i === 0 || i === 6 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'"
          >
            {{ w }}
          </div>
        </div>
        <!-- 日期格子 -->
        <div class="grid grid-cols-7 gap-y-1">
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="relative flex items-center justify-center"
          >
            <div
              class="w-9 h-9 flex items-center justify-center rounded-full text-xs transition-all"
              :class="[
                day.currentMonth ? 'text-gray-700 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600',
                isToday(day) && day.score === undefined ? 'bg-pink-500 text-white font-bold' : '',
                isToday(day) && day.score !== undefined ? 'font-bold ring-2 ring-pink-500' : ''
              ]"
              :style="getScoreBgStyle(day.score)"
            >
              {{ day.date }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 safe-area-pb">
      <div class="max-w-2xl mx-auto flex">
        <button 
          @click="router.push('/')"
          class="flex-1 py-3 flex flex-col items-center gap-1 transition-colors"
          :class="router.currentRoute.value.name === 'home' ? 'text-pink-500' : 'text-gray-400'"
        >
          <span class="text-xl">🏠</span>
          <span class="text-xs">首页</span>
        </button>
        <button 
          @click="router.push('/editor')"
          class="flex-1 py-3 flex flex-col items-center gap-1 transition-colors"
          :class="router.currentRoute.value.name === 'editor' ? 'text-pink-500' : 'text-gray-400'"
        >
          <span class="text-xl">✏️</span>
          <span class="text-xs">写日记</span>
        </button>
        <button 
          @click="router.push('/history')"
          class="flex-1 py-3 flex flex-col items-center gap-1 transition-colors"
          :class="router.currentRoute.value.name === 'history' ? 'text-pink-500' : 'text-gray-400'"
        >
          <span class="text-xl">📖</span>
          <span class="text-xs">历史</span>
        </button>
      </div>
    </nav>

    <!-- 退出确认弹窗 -->
    <div v-if="showLogoutConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4" @click.self="showLogoutConfirm = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-bounce-in">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white text-center mb-2">确认退出</h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">确定要退出登录吗？</p>
        <div class="flex gap-3">
          <button @click="showLogoutConfirm = false" class="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            取消
          </button>
          <button @click="confirmLogout" class="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">
            确认退出
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
