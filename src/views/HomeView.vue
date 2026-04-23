<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useAuthStore } from '@/stores/auth'
import { moodConfig, type MoodTag } from '@/types/diary'

const router = useRouter()
const store = useDiaryStore()
const authStore = useAuthStore()
const isDark = ref(false)
const showLogoutConfirm = ref(false)

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
  router.push('/login')
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

onMounted(() => {
  // 恢复主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})
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
      <div class="card p-6 mb-6 animate-fade-in">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-3xl">
            🌸
          </div>
          <div>
            <h2 class="text-xl font-medium text-gray-800 dark:text-white">
              {{ getGreeting() }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
              记录今天的心情，让AI陪你一起疗愈
            </p>
          </div>
        </div>
      </div>

      <!-- 今日状态 -->
      <div class="card p-6 mb-6 animate-slide-up">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">今日心情</h3>
        
        <div v-if="store.todayDiary" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ moodConfig[store.todayDiary.moodTag].emoji }}</span>
              <div>
                <p class="font-medium text-gray-800 dark:text-white">
                  {{ moodConfig[store.todayDiary.moodTag].label }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">情绪分数 {{ store.todayDiary.score }}</p>
              </div>
            </div>
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <div 
                class="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-500"
                :class="getScoreColor(store.todayDiary.score)"
              >
                {{ store.todayDiary.score }}
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {{ store.todayDiary.aiAnalyze || store.todayDiary.content }}
          </p>
          <button 
            @click="router.push(`/detail/${store.todayDiary.id}`)"
            class="text-sm text-pink-500 hover:text-pink-600 transition-colors"
          >
            查看详情 →
          </button>
        </div>
        
        <div v-else class="text-center py-6">
          <p class="text-gray-500 dark:text-gray-400 mb-4">今天还没有记录心情哦</p>
          <button @click="router.push('/editor')" class="btn-primary">
            开始记录
          </button>
        </div>
      </div>

      <!-- 统计概览 -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="card p-4 animate-slide-up" style="animation-delay: 100ms">
          <p class="text-sm text-gray-500 dark:text-gray-400">日记总数</p>
          <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ store.diaries.length }}</p>
        </div>
        <div class="card p-4 animate-slide-up" style="animation-delay: 200ms">
          <p class="text-sm text-gray-500 dark:text-gray-400">平均情绪</p>
          <p class="text-2xl font-bold" :class="getScoreColor(store.avgMoodScore)">
            {{ store.avgMoodScore }}
          </p>
        </div>
      </div>

      <!-- 最近日记 -->
      <div class="card p-6 animate-slide-up" style="animation-delay: 300ms">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-gray-800 dark:text-white">最近日记</h3>
          <button 
            @click="router.push('/history')"
            class="text-sm text-pink-500 hover:text-pink-600 transition-colors"
          >
            查看全部
          </button>
        </div>
        
        <div v-if="store.sortedDiaries.length > 0" class="space-y-3">
          <div 
            v-for="diary in store.sortedDiaries.slice(0, 3)" 
            :key="diary.id"
            @click="router.push(`/detail/${diary.id}`)"
            class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ moodConfig[diary.moodTag].emoji }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ diary.date }}</span>
              </div>
              <span class="text-xs px-2 py-1 rounded-full" :class="getMoodBgClass(diary.moodTag)">
                {{ moodConfig[diary.moodTag].label }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {{ diary.content }}
            </p>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <p class="text-gray-400 dark:text-gray-500">还没有日记</p>
          <button @click="router.push('/editor')" class="btn-secondary mt-4">
            写第一篇日记
          </button>
        </div>
      </div>
    </main>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
      <div class="max-w-2xl mx-auto flex">
        <button 
          @click="router.push('/')"
          class="flex-1 py-3 flex flex-col items-center gap-1"
          :class="router.currentRoute.value.name === 'home' ? 'text-pink-500' : 'text-gray-400'"
        >
          <span class="text-xl">🏠</span>
          <span class="text-xs">首页</span>
        </button>
        <button 
          @click="router.push('/editor')"
          class="flex-1 py-3 flex flex-col items-center gap-1"
          :class="router.currentRoute.value.name === 'editor' ? 'text-pink-500' : 'text-gray-400'"
        >
          <span class="text-xl">✏️</span>
          <span class="text-xs">写日记</span>
        </button>
        <button 
          @click="router.push('/history')"
          class="flex-1 py-3 flex flex-col items-center gap-1"
          :class="router.currentRoute.value.name === 'history' ? 'text-pink-500' : 'text-gray-400'"
        >
          <span class="text-xl">📖</span>
          <span class="text-xs">历史</span>
        </button>
      </div>
    </nav>

    <!-- 退出确认弹窗 -->
    <div v-if="showLogoutConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4" @click.self="showLogoutConfirm = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl">
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
