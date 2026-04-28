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
  // sad
  '难过': 'sad',
  '伤心': 'sad',
  '悲伤': 'sad',
  '沮丧': 'sad',
  '低落': 'sad',
  '失落': 'sad',
  '忧郁': 'sad',
  '消沉': 'sad',
  '惆怅': 'sad',
  '孤独': 'sad',
  '寂寞': 'sad',
  '郁闷': 'sad',
  '委屈': 'sad',
  '心痛': 'sad',
  // anxious
  '焦虑': 'anxious',
  '不安': 'anxious',
  '紧张': 'anxious',
  '担心': 'anxious',
  '担忧': 'anxious',
  '忐忑': 'anxious',
  '烦躁': 'anxious',
  '焦躁': 'anxious',
  '惶恐': 'anxious',
  '心慌': 'anxious',
  // calm
  '平静': 'calm',
  '平和': 'calm',
  '宁静': 'calm',
  '淡然': 'calm',
  '安详': 'calm',
  '放松': 'calm',
  '释然': 'calm',
  '从容': 'calm',
  // happy
  '开心': 'happy',
  '快乐': 'happy',
  '愉快': 'happy',
  '喜悦': 'happy',
  '愉悦': 'happy',
  '满足': 'happy',
  '幸福': 'happy',
  '欣喜': 'happy',
  '欢乐': 'happy',
  '高兴': 'happy',
  '畅快': 'happy',
  '甜蜜': 'happy',
  '感恩': 'happy',
  // angry
  '生气': 'angry',
  '愤怒': 'angry',
  '愤怒压抑': 'angry',
  '暴躁': 'angry',
  '恼怒': 'angry',
  '愤慨': 'angry',
  '厌烦': 'angry',
  '烦躁不安': 'angry',
  '愤懑': 'angry',
  '怨恨': 'angry'
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
