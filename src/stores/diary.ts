import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MoodTag, AIAnalyzeResult, DiaryItem } from '@/types/diary'
import { inferMoodLabel } from '@/types/diary'
import { getEmotionAnalyze } from '@/api/doubao'
import { diaryApi } from '@/api'

export const useDiaryStore = defineStore('diary', () => {
  // 状态
  const diaries = ref<DiaryItem[]>([])
  const currentDiary = ref<Partial<any>>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性 - 按日期由近到远排序
  const sortedDiaries = computed(() => {
    return [...diaries.value].sort((a, b) => {
      // 优先使用 date 字段，格式为 YYYY-MM-DD
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      // 如果 date 相同，用 createdAt 作为次要排序
      if (dateB === dateA) {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : dateA
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : dateB
        return createdB - createdA
      }
      return dateB - dateA
    })
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
      // 优先使用 moodLabel，如果没有则从 moodTag 推断
      const label = d.moodLabel || inferMoodLabel(d.moodTag)
      if (label && stats[label] !== undefined) {
        stats[label]++
      }
    })
    return stats
  })

  const avgMoodScore = computed(() => {
    if (diaries.value.length === 0) return 0
    const sum = diaries.value.reduce((acc, d) => acc + (d.score || 0), 0)
    return Math.round(sum / diaries.value.length)
  })

  // 从服务器加载日记
  async function loadFromServer() {
    isLoading.value = true
    error.value = null
    
    try {
      diaries.value = await diaryApi.getAll()
    } catch (e: any) {
      console.error('加载日记失败:', e)
      error.value = e.message || '加载日记失败'
    } finally {
      isLoading.value = false
    }
  }

  // 获取指定日期的日记
  const getDiaryByDate = (date: string) => {
    return diaries.value.find(d => d.date === date)
  }

  // 根据ID获取日记
  const getDiaryById = (id: string) => {
    return diaries.value.find(d => d._id === id || d.id === id)
  }

  // 创建新日记
  async function createDiary(data: {
    content: string
    moodTag: string
    score: number
    aiAnalyze?: string
    date?: string
  }): Promise<any | null> {
    isLoading.value = true
    error.value = null
    
    try {
      // 根据中文 mood 推断英文标签
      const moodLabel = inferMoodLabel(data.moodTag)
      
      const diary = await diaryApi.create({
        content: data.content,
        moodTag: data.moodTag, // 存储中文
        moodLabel: moodLabel, // 存储英文映射
        score: data.score,
        aiAnalyze: data.aiAnalyze,
        date: data.date || new Date().toISOString().split('T')[0]
      })
      
      diaries.value.unshift(diary)
      return diary
    } catch (e: any) {
      console.error('创建日记失败:', e)
      error.value = e.message || '创建日记失败'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 更新日记
  async function updateDiary(id: string, data: Partial<{
    content: string
    moodTag: string
    moodLabel?: MoodTag
    score: number
    aiAnalyze: string
  }>): Promise<any | null> {
    isLoading.value = true
    error.value = null
    
    try {
      // 如果更新了 moodTag，重新推断 moodLabel
      if (data.moodTag) {
        data.moodLabel = inferMoodLabel(data.moodTag)
      }
      
      const updated = await diaryApi.update(id, data)
      const index = diaries.value.findIndex(d => d._id === id)
      if (index !== -1) {
        diaries.value[index] = updated
      }
      return updated
    } catch (e: any) {
      console.error('更新日记失败:', e)
      error.value = e.message || '更新日记失败'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 删除日记
  async function deleteDiary(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    
    try {
      await diaryApi.delete(id)
      const index = diaries.value.findIndex(d => d._id === id)
      if (index !== -1) {
        diaries.value.splice(index, 1)
      }
      return true
    } catch (e: any) {
      console.error('删除日记失败:', e)
      error.value = e.message || '删除日记失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // AI 情绪分析 - 调用豆包模型
  const analyzeMood = async (content: string): Promise<AIAnalyzeResult> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await getEmotionAnalyze(content)
      // AI 返回的中文 mood 直接使用
      return result

    } catch (e: any) {
      console.error('AI分析失败:', e)
      error.value = e.message || 'AI分析失败，请稍后重试'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // 设置当前编辑的日记
  const setCurrentDiary = (diary: Partial<any> | null) => {
    currentDiary.value = diary || {}
  }

  // 清空错误
  const clearError = () => {
    error.value = null
  }

  // 清空数据（退出登录时）
  function clearData() {
    diaries.value = []
    currentDiary.value = {}
  }

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
    loadFromServer,
    getDiaryByDate,
    getDiaryById,
    createDiary,
    updateDiary,
    deleteDiary,
    analyzeMood,
    setCurrentDiary,
    clearError,
    clearData
  }
})
