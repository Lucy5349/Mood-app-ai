const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface RequestOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
}

// 获取 Token
function getToken(): string | null {
  return localStorage.getItem('mood_app_token')
}

// 通用请求方法
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers
  }

  if (options.body && options.method !== 'GET') {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || '请求失败')
  }
  
  return data
}

// ============ 认证 API ============

export const authApi = {
  // 注册
  register: (username: string, password: string) => {
    return request<{ _id: string; username: string; avatar: string; token: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: { username, password }
      }
    )
  },

  // 登录
  login: (username: string, password: string) => {
    return request<{ _id: string; username: string; avatar: string; token: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: { username, password }
      }
    )
  },

  // 获取当前用户
  getMe: () => {
    return request<{ _id: string; username: string; avatar: string; createdAt: string }>(
      '/api/auth/me'
    )
  }
}

// ============ 用户 API ============

export const userApi = {
  // 获取用户资料
  getProfile: () => {
    return request<{ _id: string; username: string; avatar: string; createdAt: string }>(
      '/api/user/profile'
    )
  },

  // 修改用户名
  updateUsername: (username: string) => {
    return request<{ username: string }>(
      '/api/user/username',
      {
        method: 'PUT',
        body: { username }
      }
    )
  },

  // 上传头像 (Base64)
  uploadAvatar: async (avatarData: string) => {
    return request<{ avatar: string }>(
      '/api/user/avatar/base64',
      {
        method: 'PUT',
        body: { avatar: avatarData }
      }
    )
  }
}

// ============ 日记 API ============

export const diaryApi = {
  // 获取所有日记
  getAll: () => {
    return request<any[]>('/api/diary')
  },

  // 获取今日日记
  getToday: () => {
    return request<any>('/api/diary/today')
  },

  // 获取单篇日记
  getById: (id: string) => {
    return request<any>(`/api/diary/${id}`)
  },

  // 创建日记
  create: (data: {
    content: string
    moodTag: string
    moodLabel?: string
    score: number
    aiAnalyze?: string
    date: string
  }) => {
    return request<any>(
      '/api/diary',
      {
        method: 'POST',
        body: data
      }
    )
  },

  // 更新日记
  update: (id: string, data: Partial<{
    content: string
    moodTag: string
    moodLabel?: string
    score: number
    aiAnalyze: string
  }>) => {
    return request<any>(
      `/api/diary/${id}`,
      {
        method: 'PUT',
        body: data
      }
    )
  },

  // 删除日记
  delete: (id: string) => {
    return request<{ message: string }>(
      `/api/diary/${id}`,
      { method: 'DELETE' }
    )
  },

  // 获取统计摘要
  getStats: () => {
    return request<{
      total: number
      avgScore: number
      moodDistribution: Record<string, number>
    }>('/api/diary/stats/summary')
  }
}
