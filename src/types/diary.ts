// 单条日记类型
export interface DiaryItem {
  id: string
  date: string
  content: string
  moodTag: MoodTag
  score: number // 情绪分数 0-100
  aiAnalyze: string // AI情绪解析
  relaxSentence: string // 解压语录
  createdAt: string
  updatedAt: string
}

// 情绪标签类型
export type MoodTag = 'sad' | 'anxious' | 'calm' | 'happy' | 'angry'

// 情绪标签配置
export const moodConfig: Record<MoodTag, { label: string; color: string; emoji: string }> = {
  sad: { label: '难过', color: 'gray', emoji: '😢' },
  anxious: { label: '焦虑', color: 'amber', emoji: '😰' },
  calm: { label: '平静', color: 'emerald', emoji: '😌' },
  happy: { label: '开心', color: 'pink', emoji: '😊' },
  angry: { label: '生气', color: 'red', emoji: '😠' }
}

// AI解析结果类型
export interface AIAnalyzeResult {
  score: number
  mood: MoodTag
  analyze: string
  relaxText: string
}
