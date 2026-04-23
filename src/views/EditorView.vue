<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { moodConfig, type MoodTag } from '@/types/diary'

const router = useRouter()
const route = useRoute()
const store = useDiaryStore()

// 表单数据
const content = ref('')
const selectedMood = ref<MoodTag>('calm')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const aiResult = ref<{
  score: number
  mood: MoodTag
  analyze: string
  relaxText: string
} | null>(null)

// 心情标签列表
const moodTags: { value: MoodTag; label: string; emoji: string }[] = [
  { value: 'sad', label: '难过', emoji: '😢' },
  { value: 'anxious', label: '焦虑', emoji: '😰' },
  { value: 'calm', label: '平静', emoji: '😌' },
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'angry', label: '生气', emoji: '😠' }
]

// 是否可以提交
const canSubmit = computed(() => {
  return content.value.trim().length >= 10 && aiResult.value !== null
})

// 选择心情标签
const selectMood = (mood: MoodTag) => {
  selectedMood.value = mood
}

// AI 分析
const handleAnalyze = async () => {
  if (content.value.trim().length < 10) {
    alert('请输入至少10个字的日记内容')
    return
  }
  
  try {
    const result = await store.analyzeMood(content.value)
    aiResult.value = result
    selectedMood.value = result.mood
  } catch (e) {
    console.error(e)
  }
}

// 提交日记
const handleSubmit = () => {
  if (!canSubmit.value) {
    alert('请先进行AI分析')
    return
  }

  const diary = store.createDiary({
    date: selectedDate.value,
    content: content.value.trim(),
    moodTag: selectedMood.value,
    score: aiResult.value!.score,
    aiAnalyze: aiResult.value!.analyze,
    relaxSentence: aiResult.value!.relaxText
  })

  router.push(`/detail/${diary.id}`)
}

// 获取分数颜色
const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  if (score >= 30) return 'text-orange-500'
  return 'text-red-500'
}

// 页面加载时检查是否有编辑中的日记
onMounted(() => {
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
        analyze: diary.aiAnalyze,
        relaxText: diary.relaxSentence
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
    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- 日期选择 -->
      <div class="mb-6 animate-fade-in">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          📅 选择日期
        </label>
        <input 
          v-model="selectedDate"
          type="date" 
          class="input-field"
        />
      </div>

      <!-- 心情标签选择 -->
      <div class="mb-6 animate-fade-in" style="animation-delay: 100ms">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          💭 当前心情
        </label>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="tag in moodTags"
            :key="tag.value"
            @click="selectMood(tag.value)"
            class="mood-tag flex items-center gap-2"
            :class="[
              selectedMood === tag.value 
                ? 'ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/30' 
                : 'bg-gray-100 dark:bg-gray-700'
            ]"
          >
            <span>{{ tag.emoji }}</span>
            <span>{{ tag.label }}</span>
          </button>
        </div>
      </div>

      <!-- 日记内容 -->
      <div class="mb-6 animate-fade-in" style="animation-delay: 200ms">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          ✍️ 写下今天的故事
        </label>
        <textarea
          v-model="content"
          rows="8"
          class="input-field resize-none"
          placeholder="今天发生了什么让你心情...（至少输入10个字）"
        ></textarea>
        <div class="mt-2 text-right text-sm" :class="content.length >= 10 ? 'text-emerald-500' : 'text-gray-400'">
          {{ content.length }} 字符
        </div>
      </div>

      <!-- AI 分析按钮 -->
      <div class="mb-6 animate-fade-in" style="animation-delay: 300ms">
        <button
          @click="handleAnalyze"
          :disabled="store.isLoading || content.trim().length < 10"
          class="w-full btn-secondary flex items-center justify-center gap-2"
          :class="{ 'opacity-50 cursor-not-allowed': store.isLoading || content.trim().length < 10 }"
        >
          <span v-if="store.isLoading" class="flex gap-1">
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
          </span>
          <span v-else>🤖 AI 分析情绪</span>
        </button>
      </div>

      <!-- AI 分析结果 -->
      <div v-if="aiResult" class="card p-6 mb-6 animate-bounce-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-gray-800 dark:text-white">✨ AI 情绪分析结果</h3>
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ moodConfig[aiResult.mood].emoji }}</span>
            <span class="text-3xl font-bold" :class="getScoreColor(aiResult.score)">
              {{ aiResult.score }}
            </span>
          </div>
        </div>

        <div class="space-y-4">
          <div class="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">情绪解读</p>
            <p class="text-gray-700 dark:text-gray-200">{{ aiResult.analyze }}</p>
          </div>

          <div class="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">💝 治愈语录</p>
            <p class="text-gray-700 dark:text-gray-200 italic">{{ aiResult.relaxText }}</p>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="animate-fade-in" style="animation-delay: 400ms">
        <button
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="w-full btn-primary flex items-center justify-center gap-2"
          :class="{ 'opacity-50 cursor-not-allowed': !canSubmit }"
        >
          <span>💾 保存日记</span>
        </button>
        <p v-if="!canSubmit" class="text-center text-sm text-gray-400 mt-2">
          {{ !aiResult ? '请先进行AI分析' : '日记内容至少需要10个字符' }}
        </p>
      </div>
    </main>
  </div>
</template>
