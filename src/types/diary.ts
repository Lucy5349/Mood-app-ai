// 单条日记类型
export interface DiaryItem {
  _id?: string
  id?: string
  date: string
  content: string
  moodTag: string // 存储 AI 返回的中文情绪描述
  moodLabel?: MoodTag // 映射到英文标签用于统计
  score: number // 情绪分数 0-100
  aiAnalyze?: string // AI情绪解析
  relaxSentence?: string // 解压语录
  createdAt: string
  updatedAt?: string
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

// 中文情绪描述到英文标签的映射
export const moodMapping: Record<string, MoodTag> = {
  '难过': 'sad',
  '伤心': 'sad',
  '悲伤': 'sad',
  '沮丧': 'sad',
  '焦虑': 'anxious',
  '不安': 'anxious',
  '紧张': 'anxious',
  '担心': 'anxious',
  '平静': 'calm',
  '平和': 'calm',
  '宁静': 'calm',
  '开心': 'happy',
  '快乐': 'happy',
  '愉快': 'happy',
  '喜悦': 'happy',
  '生气': 'angry',
  '愤怒': 'angry',
  '愤怒压抑': 'angry',
  '暴躁': 'angry'
}

// 根据中文情绪描述推断英文标签
export function inferMoodLabel(moodText: string): MoodTag {
  for (const [key, value] of Object.entries(moodMapping)) {
    if (moodText.includes(key)) {
      return value
    }
  }
  return 'calm' // 默认平静
}

// AI解析结果类型
export interface AIAnalyzeResult {
  score: number
  mood: string
  analyze: string
  relaxText: string
  reasoning?: string
}
