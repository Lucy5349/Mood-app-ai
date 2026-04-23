import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  username: string
  loginTime: number
}

// 预设用户数据
const USERS: Record<string, string> = {
  'admin': 'admin'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => user.value !== null)

  // 初始化 - 从 localStorage 恢复登录状态
  function init() {
    const savedUser = localStorage.getItem('mood_app_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        localStorage.removeItem('mood_app_user')
      }
    }
  }

  // 登录
  async function login(username: string, password: string): Promise<boolean> {
    // 模拟异步请求
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 验证用户
    if (USERS[username] === password) {
      user.value = {
        username,
        loginTime: Date.now()
      }
      localStorage.setItem('mood_app_user', JSON.stringify(user.value))
      return true
    }
    return false
  }

  // 登出
  function logout() {
    user.value = null
    localStorage.removeItem('mood_app_user')
  }

  // 获取当前用户名
  function getUsername(): string {
    return user.value?.username || ''
  }

  return {
    user,
    isAuthenticated,
    init,
    login,
    logout,
    getUsername
  }
})
