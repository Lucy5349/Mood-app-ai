<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { moodConfig } from '@/types/diary'

const router = useRouter()
const route = useRoute()
const store = useDiaryStore()

const diary = ref(store.getDiaryById(route.params.id as string))
const isEditing = ref(false)
const editedContent = ref('')

// 获取分数颜色
const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  if (score >= 30) return 'text-orange-500'
  return 'text-red-500'
}

// 获取分数描述
const getScoreDescription = (score: number) => {
  if (score >= 80) return '非常好'
  if (score >= 60) return '不错'
  if (score >= 40) return '一般'
  if (score >= 20) return '有点糟'
  return '很差'
}

// 获取情绪进度条颜色
const getProgressColor = (score: number) => {
  if (score >= 70) return 'from-emerald-400 to-emerald-500'
  if (score >= 50) return 'from-amber-400 to-amber-500'
  if (score >= 30) return 'from-orange-400 to-orange-500'
  return 'from-red-400 to-red-500'
}

// 编辑日记
const startEdit = () => {
  editedContent.value = diary.value!.content
  isEditing.value = true
}

// 保存编辑
const saveEdit = async () => {
  if (editedContent.value.trim().length < 10) {
    alert('日记内容至少需要10个字符')
    return
  }
  
  const result = await store.analyzeMood(editedContent.value)
  
  store.updateDiary(diary.value!.id, {
    content: editedContent.value.trim(),
    moodTag: result.mood,
    score: result.score,
    aiAnalyze: result.analyze,
    relaxSentence: result.relaxText
  })
  
  diary.value = store.getDiaryById(route.params.id as string)
  isEditing.value = false
}

// 删除日记
const handleDelete = () => {
  if (confirm('确定要删除这篇日记吗？')) {
    store.deleteDiary(diary.value!.id)
    router.push('/history')
  }
}

// 复制解压语录
const copyRelaxText = () => {
  if (diary.value?.relaxSentence) {
    navigator.clipboard.writeText(diary.value.relaxSentence)
    alert('已复制到剪贴板')
  }
}

onMounted(() => {
  if (!diary.value) {
    router.push('/history')
  }
})
</script>

<template>
  <div class="min-h-screen pb-20" v-if="diary">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span class="text-xl">←</span>
        </button>
        <h1 class="text-lg font-semibold text-gray-800 dark:text-white">{{ diary.date }}</h1>
        <button 
          @click="isEditing ? saveEdit() : startEdit()"
          class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-pink-500"
        >
          <span v-if="isEditing" class="text-sm font-medium">保存</span>
          <span v-else class="text-xl">✏️</span>
        </button>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- 情绪概览 -->
      <div class="card p-6 mb-6 animate-bounce-in">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4">
            <span class="text-5xl">{{ moodConfig[diary.moodTag].emoji }}</span>
            <div>
              <p class="text-xl font-medium text-gray-800 dark:text-white">
                {{ moodConfig[diary.moodTag].label }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ getScoreDescription(diary.score) }}
              </p>
            </div>
          </div>
          <div class="relative w-24 h-24">
            <svg class="w-full h-full transform -rotate-90">
              <circle
                cx="48" cy="48" r="40"
                class="fill-none stroke-gray-200 dark:stroke-gray-700"
                stroke-width="8"
              />
              <circle
                cx="48" cy="48" r="40"
                class="fill-none"
                :class="`bg-gradient-to-r ${getProgressColor(diary.score)}`"
                stroke-width="8"
                :stroke-dasharray="`${diary.score * 2.51} 251`"
                stroke-linecap="round"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-bold" :class="getScoreColor(diary.score)">
                {{ diary.score }}
              </span>
            </div>
          </div>
        </div>

        <!-- AI 分析 -->
        <div v-if="diary.aiAnalyze" class="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">💭 AI 情绪解读</p>
          <p class="text-gray-700 dark:text-gray-200">{{ diary.aiAnalyze }}</p>
        </div>
      </div>

      <!-- 日记内容 -->
      <div class="card p-6 mb-6 animate-slide-up" style="animation-delay: 100ms">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">📖 日记内容</h3>
        
        <textarea
          v-if="isEditing"
          v-model="editedContent"
          rows="10"
          class="input-field resize-none"
          placeholder="写下今天的故事..."
        ></textarea>
        <p v-else class="text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
          {{ diary.content }}
        </p>
        
        <p v-if="isEditing" class="mt-2 text-right text-sm" :class="editedContent.length >= 10 ? 'text-emerald-500' : 'text-gray-400'">
          {{ editedContent.length }} / 10 字符
        </p>
      </div>

      <!-- 解压语录 -->
      <div v-if="diary.relaxSentence" class="card p-6 mb-6 animate-slide-up" style="animation-delay: 200ms">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">💝 治愈语录</h3>
          <button 
            @click="copyRelaxText"
            class="text-sm text-pink-500 hover:text-pink-600 transition-colors"
          >
            📋 复制
          </button>
        </div>
        <p class="text-gray-700 dark:text-gray-200 italic leading-relaxed">
          {{ diary.relaxSentence }}
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-4 animate-slide-up" style="animation-delay: 300ms">
        <button 
          v-if="!isEditing"
          @click="handleDelete"
          class="flex-1 py-3 text-red-500 border-2 border-red-200 dark:border-red-800 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          🗑️ 删除日记
        </button>
        <button 
          v-if="isEditing"
          @click="isEditing = false"
          class="flex-1 py-3 btn-secondary"
        >
          取消编辑
        </button>
      </div>

      <!-- 元信息 -->
      <div class="mt-8 text-center text-xs text-gray-400 dark:text-gray-500 animate-fade-in" style="animation-delay: 400ms">
        <p>创建于 {{ diary.createdAt }}</p>
        <p v-if="diary.updatedAt !== diary.createdAt">更新于 {{ diary.updatedAt }}</p>
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
          class="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400"
        >
          <span class="text-xl">📖</span>
          <span class="text-xs">历史</span>
        </button>
      </div>
    </nav>
  </div>
</template>
