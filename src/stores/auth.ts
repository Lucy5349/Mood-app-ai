import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi } from '@/api'

interface User {
  _id: string
  username: string
  avatar: string | null
  createdAt?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 初始化 - 从 localStorage 恢复登录状态
  function init() {
    const savedToken = localStorage.getItem('mood_app_token')
    const savedUser = localStorage.getItem('mood_app_user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch {
        logout()
      }
    }
  }

  // 注册
  async function register(username: string, password: string): Promise<{ success: boolean; message: string }> {
    isLoading.value = true
    
    try {
      const response = await authApi.register(username, password)
      token.value = response.token
      user.value = {
        _id: response._id,
        username: response.username,
        avatar: response.avatar
      }
      
      localStorage.setItem('mood_app_token', response.token)
      localStorage.setItem('mood_app_user', JSON.stringify(user.value))
      
      return { success: true, message: '注册成功' }
    } catch (error: any) {
      return { success: false, message: error.message || '注册失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 登录
  async function login(username: string, password: string): Promise<{ success: boolean; message: string }> {
    isLoading.value = true
    
    try {
      const response = await authApi.login(username, password)
      token.value = response.token
      user.value = {
        _id: response._id,
        username: response.username,
        avatar: response.avatar
      }
      
      localStorage.setItem('mood_app_token', response.token)
      localStorage.setItem('mood_app_user', JSON.stringify(user.value))
      
      return { success: true, message: '登录成功' }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('mood_app_token')
    localStorage.removeItem('mood_app_user')
  }

  // 获取当前用户名
  function getUsername(): string {
    return user.value?.username || ''
  }

  // 获取用户头像
  function getAvatar(): string | null {
    return user.value?.avatar || null
  }

  // 刷新用户信息
  async function refreshUser() {
    if (!token.value) return
    
    try {
      const profile = await userApi.getProfile()
      user.value = {
        _id: profile._id,
        username: profile.username,
        avatar: profile.avatar,
        createdAt: profile.createdAt
      }
      localStorage.setItem('mood_app_user', JSON.stringify(user.value))
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  // 更新头像
  async function updateAvatar(avatarData: string): Promise<boolean> {
    try {
      const result = await userApi.uploadAvatar(avatarData)
      if (user.value) {
        user.value.avatar = result.avatar
        localStorage.setItem('mood_app_user', JSON.stringify(user.value))
      }
      return true
    } catch (error) {
      console.error('更新头像失败:', error)
      return false
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    init,
    register,
    login,
    logout,
    getUsername,
    getAvatar,
    refreshUser,
    updateAvatar
  }
})
