import { defineStore } from 'pinia'
import api from '@/services/api'

/**
 * Auth Store
 * Manages authentication state
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userName: (state) => state.user?.businessName || state.user?.email || 'User'
  },

  actions: {
    async register(email, password, businessName) {
      const response = await api.auth.register({ email, password, businessName })
      this.setAuth(response.data.token, response.data.user)
      return response.data
    },

    async login(email, password) {
      const response = await api.auth.login({ email, password })
      this.setAuth(response.data.token, response.data.user)
      return response.data
    },

    setAuth(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
