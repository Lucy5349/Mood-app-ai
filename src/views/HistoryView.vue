<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { moodConfig, type MoodTag } from '@/types/diary'

const router = useRouter()
const store = useDiaryStore()

// 筛选状态
const filterMood = ref<MoodTag | 'all'>('all')
const searchKeyword = ref('')

// 筛选后的日记列表
const filteredDiaries = computed(() => {
  let result = store.sortedDiaries
  
  if (filterMood.value !== 'all') {
    result = result.filter(d => d.moodTag === filterMood.value)
  }
  
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(d => 
      d.content.toLowerCase().includes(keyword) ||
      d.aiAnalyze.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

// 按月份分组
const groupedDiaries = computed(() => {
  const groups: Record<string, typeof filteredDiaries.value> = {}
  
  filteredDiaries.value.forEach(diary => {
    const month = diary.date.substring(0, 7) // YYYY-MM
    if (!groups[month]) {
      groups[month] = []
    }
    groups[month].push(diary)
  })
  
  return groups
})

// 格式化月份显示
const formatMonth = (month: string) => {
  const [year, m] = month.split('-')
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                      '七月', '八月', '九月', '十月', '十一月', '十二月']
  return `${year}年 ${monthNames[parseInt(m) - 1]}`
}

// 心情标签列表
const moodFilters: { value: MoodTag | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: '全部', emoji: '📋' },
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'calm', label: '平静', emoji: '😌' },
  { value: 'anxious', label: '焦虑', emoji: '😰' },
  { value: 'sad', label: '难过', emoji: '😢' },
  { value: 'angry', label: '生气', emoji: '😠' }
]

// 删除日记
const handleDelete = (id: string) => {
  if (confirm('确定要删除这篇日记吗？')) {
    store.deleteDiary(id)
  }
}

function getScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  if (score >= 30) return 'text-orange-500'
  return 'text-red-500'
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span class="text-xl">←</span>
        </button>
        <h1 class="text-lg font-semibold text-gray-800 dark:text-white">历史日记</h1>
        <div class="w-10"></div>
      </div>
    </header>

    <!-- 搜索和筛选 -->
    <div class="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <!-- 搜索框 -->
      <div class="animate-fade-in">
        <input
          v-model="searchKeyword"
          type="text"
          class="input-field"
          placeholder="🔍 搜索日记内容..."
        />
      </div>

      <!-- 心情筛选 -->
      <div class="flex gap-2 overflow-x-auto pb-2 animate-fade-in" style="animation-delay: 100ms">
        <button
          v-for="filter in moodFilters"
          :key="filter.value"
          @click="filterMood = filter.value"
          class="mood-tag whitespace-nowrap flex items-center gap-1"
          :class="filterMood === filter.value 
            ? 'ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/30' 
            : 'bg-gray-100 dark:bg-gray-700'"
        >
          <span>{{ filter.emoji }}</span>
          <span>{{ filter.label }}</span>
        </button>
      </div>
    </div>

    <!-- 日记列表 -->
    <main class="max-w-2xl mx-auto px-4">
      <div v-if="filteredDiaries.length > 0">
        <div v-for="(diaries, month) in groupedDiaries" :key="month" class="mb-6">
          <!-- 月份标题 -->
          <div class="sticky top-14 z-10 py-2 bg-gradient-to-b from-white/90 to-transparent dark:from-gray-900/90 dark:to-transparent">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ formatMonth(month) }}
            </h3>
          </div>

          <!-- 日记卡片 -->
          <div class="space-y-3">
            <div 
              v-for="(diary, index) in diaries" 
              :key="diary.id"
              @click="router.push(`/detail/${diary.id}`)"
              class="card p-4 cursor-pointer hover:shadow-xl transition-all duration-300 animate-slide-up"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl">{{ moodConfig[diary.moodTag].emoji }}</span>
                    <div>
                      <p class="font-medium text-gray-800 dark:text-white">{{ diary.date }}</p>
                      <p class="text-xs text-gray-400">{{ moodConfig[diary.moodTag].label }}</p>
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {{ diary.content }}
                  </p>
                  <p v-if="diary.aiAnalyze" class="text-xs text-pink-500 mt-2 line-clamp-1">
                    💭 {{ diary.aiAnalyze }}
                  </p>
                </div>
                <div class="flex flex-col items-center ml-4">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <span class="font-bold" :class="getScoreColor(diary.score)">{{ diary.score }}</span>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button 
                  @click.stop="router.push(`/editor?edit=${diary.id}`)"
                  class="flex-1 py-1.5 text-xs text-gray-500 hover:text-pink-500 transition-colors"
                >
                  ✏️ 编辑
                </button>
                <button 
                  @click.stop="handleDelete(diary.id)"
                  class="flex-1 py-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-20 animate-fade-in">
        <div class="text-6xl mb-4">📝</div>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          {{ searchKeyword || filterMood !== 'all' ? '没有找到符合条件的日记' : '还没有日记哦' }}
        </p>
        <button @click="router.push('/editor')" class="btn-primary">
          开始写日记
        </button>
      </div>
    </main>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
      <div class="max-w-2xl mx-auto flex">
        <button 
          @click="router.push('/')"
          class="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400"
        >
          <span class="text-xl">🏠</span>
          <span class="text-xs">首页</span>
        </button>
        <button 
          @click="router.push('/editor')"
          class="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400"
        >
          <span class="text-xl">✏️</span>
          <span class="text-xs">写日记</span>
        </button>
        <button 
          @click="router.push('/history')"
          class="flex-1 py-3 flex flex-col items-center gap-1 text-pink-500"
        >
          <span class="text-xl">📖</span>
          <span class="text-xs">历史</span>
        </button>
      </div>
    </nav>
  </div>
</template>