import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DiaryItem, MoodTag, AIAnalyzeResult } from '@/types/diary'
import { getEmotionAnalyze } from '@/api/doubao'

const STORAGE_KEY = 'mood-diary-data'

export const useDiaryStore = defineStore('diary', () => {
  // 状态
  const diaries = ref<DiaryItem[]>([])
  const currentDiary = ref<Partial<DiaryItem>>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 初始化从本地存储加载数据
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        diaries.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('加载本地数据失败:', e)
    }
  }

  // 保存到本地存储
  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries.value))
    } catch (e) {
      console.error('保存本地数据失败:', e)
    }
  }

  // 计算属性
  const sortedDiaries = computed(() => {
    return [...diaries.value].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })

  const todayDiary = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return diaries.value.find(d => d.date === today)
  })

  const moodStats = computed(() => {
    const stats: Record<MoodTag, number> = {
      sad: 0, anxious: 0, calm: 0, happy: 0, angry: 0
    }
    diaries.value.forEach(d => {
      stats[d.moodTag]++
    })
    return stats
  })

  const avgMoodScore = computed(() => {
    if (diaries.value.length === 0) return 0
    const sum = diaries.value.reduce((acc, d) => acc + d.score, 0)
    return Math.round(sum / diaries.value.length)
  })

  // 获取指定日期的日记
  const getDiaryByDate = (date: string) => {
    return diaries.value.find(d => d.date === date)
  }

  // 根据ID获取日记
  const getDiaryById = (id: string) => {
    return diaries.value.find(d => d.id === id)
  }

  // 创建新日记
  const createDiary = (data: Partial<DiaryItem>) => {
    const now = new Date().toISOString()
    const diary: DiaryItem = {
      id: `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: data.date || new Date().toISOString().split('T')[0],
      content: data.content || '',
      moodTag: data.moodTag || 'calm',
      score: data.score || 50,
      aiAnalyze: data.aiAnalyze || '',
      relaxSentence: data.relaxSentence || '',
      createdAt: now,
      updatedAt: now
    }
    diaries.value.push(diary)
    saveToStorage()
    return diary
  }

  // 更新日记
  const updateDiary = (id: string, data: Partial<DiaryItem>) => {
    const index = diaries.value.findIndex(d => d.id === id)
    if (index !== -1) {
      diaries.value[index] = {
        ...diaries.value[index],
        ...data,
        updatedAt: new Date().toISOString()
      }
      saveToStorage()
      return diaries.value[index]
    }
    return null
  }

  // 删除日记
  const deleteDiary = (id: string) => {
    const index = diaries.value.findIndex(d => d.id === id)
    if (index !== -1) {
      diaries.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }

  // AI 情绪分析 - 调用豆包模型
  const analyzeMood = async (content: string): Promise<AIAnalyzeResult> => {
    isLoading.value = true
    error.value = null

    try {
      // 调用豆包API
      const result = await getEmotionAnalyze(content)

      // 验证mood字段
      const validMoods: MoodTag[] = ['sad', 'anxious', 'calm', 'happy', 'angry']
      if (!validMoods.includes(result.mood as MoodTag)) {
        result.mood = 'calm'
      }

      return result as AIAnalyzeResult

    } catch (e: any) {
      console.error('AI分析失败:', e)
      error.value = e.message || 'AI分析失败，请稍后重试'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // 设置当前编辑的日记
  const setCurrentDiary = (diary: Partial<DiaryItem> | null) => {
    currentDiary.value = diary || {}
  }

  // 清空错误
  const clearError = () => {
    error.value = null
  }

  // 初始化
  loadFromStorage()

  return {
    // 状态
    diaries,
    currentDiary,
    isLoading,
    error,
    // 计算属性
    sortedDiaries,
    todayDiary,
    moodStats,
    avgMoodScore,
    // 方法
    loadFromStorage,
    saveToStorage,
    getDiaryByDate,
    getDiaryById,
    createDiary,
    updateDiary,
    deleteDiary,
    analyzeMood,
    setCurrentDiary,
    clearError
  }
})
