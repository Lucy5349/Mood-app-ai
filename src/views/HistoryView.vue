<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useTodoStore } from '@/stores/todo'
import { moodConfig, moodMapping, type MoodTag, type DiaryItem } from '@/types/diary'

const router = useRouter()
const store = useDiaryStore()
const todoStore = useTodoStore()

// 筛选状态
const filterMood = ref<MoodTag | 'all'>('all')
const searchKeyword = ref('')
const isLoading = ref(true)

// TODO 展开状态
const expandedTodoId = ref<string | null>(null)
const todoInputs = ref<Record<string, string>>({})

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
      (d.aiAnalyze && d.aiAnalyze.toLowerCase().includes(keyword))
    )
  }
  
  return result
})

// 按月份分组（月份按时间从新到旧排列）
const groupedDiaries = computed(() => {
  const groups: Record<string, DiaryItem[]> = {}
  
  filteredDiaries.value.forEach(diary => {
    const month = diary.date.substring(0, 7) // YYYY-MM
    if (!groups[month]) {
      groups[month] = []
    }
    groups[month].push(diary)
  })
  
  // 按月份 key 倒序排列（最新的月份在前）
  const sortedGroups: Record<string, DiaryItem[]> = {}
  Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .forEach(key => {
      sortedGroups[key] = groups[key]
    })
  
  return sortedGroups
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
const handleDelete = async (id: string) => {
  if (confirm('确定要删除这篇日记吗？')) {
    await store.deleteDiary(id)
  }
}

function getScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  if (score >= 30) return 'text-orange-500'
  return 'text-red-500'
}

// 加载数据
onMounted(async () => {
  todoStore.init()
  if (store.diaries.length === 0) {
    await store.loadFromServer()
  }
  isLoading.value = false
})

// 获取日记对应的 TODO 列表
function getDiaryTodos(date: string) {
  return todoStore.getTodosByDate(date)
}

// 切换 TODO 展开状态
function toggleTodoExpand(diaryId: string) {
  if (expandedTodoId.value === diaryId) {
    expandedTodoId.value = null
  } else {
    expandedTodoId.value = diaryId
  }
}

// 添加已完成 TODO（只能添加已完成的）
function addCompletedTodo(diaryId: string, date: string) {
  if (!date) return
  const text = todoInputs.value[diaryId]
  if (text?.trim()) {
    // 添加新 TODO，标记为已完成
    todoStore.addTodoAsCompleted(text.trim(), date)
    todoInputs.value[diaryId] = ''
  }
}

// 删除 TODO
function deleteTodo(todoId: string) {
  todoStore.deleteTodo(todoId)
}

// 监听回车添加
function handleTodoKeydown(e: KeyboardEvent, diaryId: string, date: string) {
  if (!date) return
  if (e.key === 'Enter') {
    addCompletedTodo(diaryId, date)
  }
}

// 根据 moodTag（中文）获取对应的 emoji
function getMoodEmoji(moodTag: string): string {
  const moodEn = moodMapping[moodTag] || moodTag
  return moodConfig[moodEn as MoodTag]?.emoji || '❓'
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
    <div class="max-w-2xl mx-auto px-4 py-4 space-y-3">
      <!-- 搜索框 -->
      <div class="relative animate-fade-in">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          v-model="searchKeyword"
          type="text"
          class="input-field pl-10 text-sm"
          placeholder="搜索日记内容..."
        />
        <button 
          v-if="searchKeyword"
          @click="searchKeyword = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <!-- 心情筛选 -->
      <div class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 animate-fade-in scrollbar-hide" style="animation-delay: 150ms">
        <button
          v-for="filter in moodFilters"
          :key="filter.value"
          @click="filterMood = filter.value"
          class="whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 flex-shrink-0"
          :class="filterMood === filter.value 
            ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30' 
            : 'bg-white/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500 hover:border-pink-200'"
        >
          <span class="text-lg">{{ filter.emoji }}</span>
          <span>{{ filter.label }}</span>
        </button>
      </div>
    </div>

    <!-- 日记列表 -->
    <main class="max-w-2xl mx-auto px-4">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="space-y-4 py-4">
        <div v-for="i in 5" :key="i" class="card p-4 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full skeleton"></div>
            <div class="space-y-2 flex-1">
              <div class="h-4 w-24 skeleton rounded"></div>
              <div class="h-3 w-16 skeleton rounded"></div>
            </div>
            <div class="w-10 h-10 rounded-full skeleton"></div>
          </div>
          <div class="h-3 w-full skeleton rounded"></div>
          <div class="h-3 w-3/4 skeleton rounded"></div>
        </div>
      </div>

      <div v-else-if="filteredDiaries.length > 0">
        <!-- 统计信息 -->
        <div class="mb-4 px-1">
          <p class="text-xs text-gray-400 dark:text-gray-500">
            共 {{ filteredDiaries.length }} 篇日记
          </p>
        </div>
        
        <div v-for="(diaries, month) in groupedDiaries" :key="month" class="mb-6">
          <!-- 月份标题 -->
          <div class="sticky top-14 z-10 py-2 px-3 bg-white/60 mb-2 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 dark:border-gray-700/30 rounded-xl shadow-sm">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ formatMonth(month) }}
              </h3>
              <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                {{ diaries.length }}篇
              </span>
            </div>
          </div> 

          <!-- 日记卡片 -->
          <div class="space-y-3">
            <div 
              v-for="(diary, index) in diaries" 
              :key="diary._id || diary.id"
              @click="router.push(`/detail/${diary._id || diary.id}`)"
              class="card p-4 cursor-pointer hover:shadow-lg transition-all duration-300 card-hover animate-slide-up"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl flex-shrink-0">{{ getMoodEmoji(diary.moodTag) }}</span>
                    <div class="min-w-0">
                      <p class="font-medium text-gray-800 dark:text-white">{{ diary.date }}</p>
                      <p class="text-xs text-gray-400">{{ diary.moodTag }}</p>
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {{ diary.content }}
                  </p>
                  <p v-if="diary.aiAnalyze" class="text-xs text-pink-500 mt-2 line-clamp-1 flex items-center gap-1">
                    <span>💭</span>
                    <span class="truncate">{{ diary.aiAnalyze }}</span>
                  </p>
                </div>
                <div class="flex flex-col items-center flex-shrink-0">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-sm">
                    <span class="font-bold text-sm" :class="getScoreColor(diary.score)">{{ diary.score }}</span>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button 
                  @click.stop="router.push(`/editor?edit=${diary._id || diary.id}`)"
                  class="flex-1 py-2 text-xs text-gray-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>✏️</span>
                  <span>编辑</span>
                </button>
                <button
                  @click.stop="toggleTodoExpand(diary._id || diary.id || '')"
                  class="flex-1 py-2 text-xs text-gray-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>✅</span>
                  <span>清单</span>
                </button>
                <button 
                  @click.stop="handleDelete(diary._id || diary.id || '')"
                  class="flex-1 py-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>🗑️</span>
                  <span>删除</span>
                </button>
              </div>

              <!-- TODO 展开面板 -->
              <div 
                v-if="expandedTodoId === (diary._id || diary.id) && diary.date"
                class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 animate-fade-in"
                @click.stop
              >
                <p class="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <span>📋</span>
                  <span>当日完成（添加即标记为已完成）</span>
                </p>
                
                <!-- 已有 TODO 列表 -->
                <div v-if="getDiaryTodos(diary.date).length > 0" class="space-y-1 mb-3 max-h-32 overflow-y-auto">
                  <div 
                    v-for="todo in getDiaryTodos(diary.date)" 
                    :key="todo.id"
                    class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group"
                  >
                    <div 
                      class="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      :class="todo.completed ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-600'"
                    >
                      <span v-if="todo.completed" class="text-[10px]">✓</span>
                    </div>
                    <span 
                      class="flex-1 text-xs truncate"
                      :class="todo.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'"
                    >
                      {{ todo.text }}
                    </span>
                    <button 
                      @click.stop="deleteTodo(todo.id)"
                      class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <!-- 添加已完成 TODO 输入框 -->
                <div class="flex gap-2">
                  <input
                    v-model="todoInputs[diary._id || diary.id || '']"
                    @keydown="(e) => handleTodoKeydown(e, diary._id || diary.id || '', diary.date || '')"
                    type="text"
                    class="input-field flex-1 text-xs py-2"
                    placeholder="添加已完成的任务..."
                  />
                  <button 
                    @click.stop="addCompletedTodo(diary._id || diary.id || '', diary.date || '')"
                    class="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm flex-shrink-0"
                  >
                    ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-20 animate-fade-in">
        <div class="text-6xl mb-4">📝</div>
        <p class="text-gray-500 dark:text-gray-400 mb-2">
          {{ searchKeyword || filterMood !== 'all' ? '没有找到符合条件的日记' : '还没有日记哦' }}
        </p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">
          {{ searchKeyword || filterMood !== 'all' ? '试试其他关键词或筛选条件' : '开始记录你的心情吧' }}
        </p>
        <button v-if="!searchKeyword && filterMood === 'all'" @click="router.push('/editor')" class="btn-primary">
          开始写日记
        </button>
      </div>
    </main>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 safe-area-pb">
      <div class="max-w-2xl mx-auto flex">
        <button 
          @click="router.push('/')"
          class="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400 transition-colors"
        >
          <span class="text-xl">🏠</span>
          <span class="text-xs">首页</span>
        </button>
        <button 
          @click="router.push('/editor')"
          class="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400 transition-colors"
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