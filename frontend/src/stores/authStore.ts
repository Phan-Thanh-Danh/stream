import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { AuthUser, LoginRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  // Rehydrate from localStorage on store init
  const storedUser = localStorage.getItem('auth_user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch {
      localStorage.removeItem('auth_user')
    }
  }

  const isAuthenticated = computed(() => !!user.value?.token)
  const isSharer = computed(() => user.value?.role === 'Sharer')
  const isViewer = computed(() => user.value?.role === 'Viewer')
  const token = computed(() => user.value?.token ?? null)

  async function login(request: LoginRequest) {
    const { data } = await authApi.login(request)

    const authUser: AuthUser = {
      userId: data.userId,
      username: data.username,
      role: data.role,
      token: data.token
    }

    user.value = authUser
    localStorage.setItem('auth_user', JSON.stringify(authUser))
    localStorage.setItem('access_token', data.token)
  }

  function logout() {
    user.value = null
    localStorage.removeItem('auth_user')
    localStorage.removeItem('access_token')
  }

  return { user, isAuthenticated, isSharer, isViewer, token, login, logout }
})
