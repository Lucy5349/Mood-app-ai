<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { moodMapping, type MoodTag } from '@/types/diary'

const router = useRouter()
const route = useRoute()
const store = useDiaryStore()

// 表单数据
const content = ref('')
const selectedMood = ref<string>('calm')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const aiResult = ref<{
  score: number
  mood: string
  analyze: string
  relaxText: string
} | null>(null)

// 心情标签列表
const moodTags: { value: MoodTag; label: string; emoji: string; synonyms: string[] }[] = [
  { value: 'sad', label: '难过', emoji: '😢', synonyms: ['sad', 'sorrowful', 'melancholy'] },
  { value: 'anxious', label: '焦虑', emoji: '😰', synonyms: ['anxious', 'worried', 'nervous'] },
  { value: 'calm', label: '平静', emoji: '😌', synonyms: ['calm', 'peaceful', 'serene'] },
  { value: 'happy', label: '开心', emoji: '😊', synonyms: ['happy', 'joyful', 'cheerful'] },
  { value: 'angry', label: '生气', emoji: '😠', synonyms: ['angry', 'irritated', 'frustrated'] }
]

// 是否可以提交
const canSubmit = computed(() => {
  return content.value.trim().length >= 10 && aiResult.value !== null
})

// AI 分析
const handleAnalyze = async () => {
  if (content.value.trim().length < 10) {
    alert('请输入至少10个字的日记内容')
    return
  }
  
  try {
    const result = await store.analyzeMood(content.value)
    aiResult.value = result
    // 将 AI 返回的中文 mood 转换为英文
    const moodEn = moodMapping[result.mood]
    if (moodEn) {
      selectedMood.value = moodEn
    } else {
      // 尝试通过同义词匹配
      const lowerMood = result.mood.toLowerCase()
      const matched = moodTags.find(t => 
        t.synonyms.some(syn => syn.toLowerCase() === lowerMood) || t.value.toLowerCase() === lowerMood
      )
      if (matched) selectedMood.value = matched.value
    }
  } catch (e) {
    console.error(e)
  }
}

// 提交日记
const handleSubmit = async () => {
  if (!canSubmit.value) {
    alert('请先进行AI分析')
    return
  }

  const diary = await store.createDiary({
    date: selectedDate.value,
    content: content.value.trim(),
    moodTag: selectedMood.value,
    score: aiResult.value!.score,
    aiAnalyze: aiResult.value!.analyze
  })

  if (diary) {
    router.push('/history')
  }
}

// 获取分数颜色
const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  if (score >= 30) return 'text-orange-500'
  return 'text-red-500'
}

// 页面加载时检查是否有编辑中的日记
onMounted(async () => {
  // 如果 store 中没有数据，先加载
  if (store.diaries.length === 0) {
    await store.loadFromServer()
  }
  
  const editId = route.query.edit as string
  if (editId) {
    const diary = store.getDiaryById(editId)
    if (diary) {
      content.value = diary.content
      selectedMood.value = diary.moodTag
      selectedDate.value = diary.date
      aiResult.value = {
        score: diary.score,
        mood: diary.moodTag,
        analyze: diary.aiAnalyze || '',
        relaxText: ''
      }
    }
  }
})
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span class="text-xl">←</span>
        </button>
        <h1 class="text-lg font-semibold text-gray-800 dark:text-white">写日记</h1>
        <div class="w-10"></div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="max-w-2xl mx-auto px-4 py-5">
      <!-- 日期选择 -->
      <div class="mb-5">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
          <span>📅</span>
          <span>选择日期</span>
        </label>
        <div class="date-picker-wrapper">
          <input 
            v-model="selectedDate"
            type="date" 
            class="date-picker"
          />
        </div>
      </div>

      <!-- 心情标签选择 -->
      <div class="mb-5">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
          <span>💭</span>
          <span>当前心情</span>
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in moodTags"
            :key="tag.value"
            @click="selectedMood = tag.value"
            class="mood-tag flex items-center gap-2 px-4 py-2.5"
            :class="[
              selectedMood === tag.value
                ? 'ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            ]"
          >
            <span class="text-lg">{{ tag.emoji }}</span>
            <span class="text-sm font-medium">{{ tag.label }}</span>
          </button>
        </div>
      </div>

      <!-- 日记内容 -->
      <div class="mb-5">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
          <span>✍️</span>
          <span>写下今天的故事</span>
        </label>
        <textarea
          v-model="content"
          rows="7"
          class="input-field resize-none text-sm leading-relaxed"
          placeholder="今天发生了什么让你心情...（至少输入10个字）"
        ></textarea>
        <div class="mt-2 flex items-center justify-between text-sm">
          <span class="text-xs text-gray-400">写得越多，AI分析越准确</span>
          <span :class="content.length >= 10 ? 'text-emerald-500' : 'text-gray-400'">
            {{ content.length }} 字符
          </span>
        </div>
      </div>

      <!-- AI 分析按钮 -->
      <div class="mb-5">
        <button
          @click="handleAnalyze"
          :disabled="store.isLoading || content.trim().length < 10"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30 flex items-center justify-center gap-2"
          :class="{ 'opacity-50 cursor-not-allowed': store.isLoading || content.trim().length < 10 }"
        >
          <span v-if="store.isLoading" class="flex items-center gap-2">
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
            <span>AI 分析中...</span>
          </span>
          <span v-else class="flex items-center gap-2">
            <span>🤖</span>
            <span>AI 分析情绪</span>
          </span>
        </button>
      </div>

      <!-- AI 分析结果 -->
      <div v-if="aiResult" class="card p-5 mb-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <h3 class="font-medium text-gray-800 dark:text-white">✨ AI 情绪分析</h3>
            <span class="px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-600 dark:text-pink-400 text-sm font-medium">
              {{ aiResult.mood }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-3xl font-bold" :class="getScoreColor(aiResult.score)">
              {{ aiResult.score }}
            </span>
            <span class="text-sm text-gray-400">分</span>
          </div>
        </div>

        <div class="space-y-3">
          <div class="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <span>💭</span>
              <span>情绪解读</span>
            </p>
            <p class="text-gray-700 dark:text-gray-200 leading-relaxed">{{ aiResult.analyze }}</p>
          </div>

          <div class="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <span>💝</span>
              <span>治愈语录</span>
            </p>
            <p class="text-gray-700 dark:text-gray-200 italic leading-relaxed">{{ aiResult.relaxText }}</p>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div>
        <button
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="w-full btn-primary flex items-center justify-center gap-2"
          :class="{ 'opacity-50 cursor-not-allowed': !canSubmit }"
        >
          <span>💾</span>
          <span>保存日记</span>
        </button>
        <p v-if="!canSubmit" class="text-center text-sm text-gray-400 mt-2">
          {{ !aiResult ? '请先进行AI分析' : '日记内容至少需要10个字符' }}
        </p>
      </div>
      
      <!-- 底部留白 -->
      <div class="h-4"></div>
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
          class="flex-1 py-3 flex flex-col items-center gap-1 text-pink-500"
        >
          <span class="text-xl">✏️</span>
          <span class="text-xs">写日记</span>
        </button>
        <button 
          @click="router.push('/history')"
          class="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400 transition-colors"
        >
          <span class="text-xl">📖</span>
          <span class="text-xs">历史</span>
        </button>
      </div>
    </nav>
  </div>
</template>
