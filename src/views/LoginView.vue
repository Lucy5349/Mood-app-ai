<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
  error.value = ''
  
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入用户名和密码'
    return
  }
  
  isLoading.value = true
  
  try {
    const success = await authStore.login(username.value, password.value)
    if (success) {
      router.push('/')
    } else {
      error.value = '用户名或密码错误'
    }
  } catch (e) {
    error.value = '登录失败，请重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-4xl shadow-lg">
          🌸
        </div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white mt-4">情绪日记</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">记录心情，疗愈自我</p>
      </div>

      <!-- 登录表单 -->
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl p-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-6 text-center">登录账号</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- 用户名 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              用户名
            </label>
            <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
            />
          </div>

          <!-- 密码 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              密码
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
            />
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span v-if="isLoading">登录中...</span>
            <span v-else>登 录</span>
          </button>
        </form>

        <!-- 提示信息 -->
        <p class="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
          测试账号: admin / admin
        </p>
      </div>
    </div>
  </div>
</template>
