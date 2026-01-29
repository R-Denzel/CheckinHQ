import { defineStore } from 'pinia'
import api from '@/services/api'

/**
 * Auth Store
 * Manages authentication state
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    showPaywall: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userName: (state) => state.user?.businessName || state.user?.email || 'User',
    businessType: (state) => state.user?.businessType || 'airbnb',
    isAdmin: (state) => state.user?.isAdmin || false,
    preferredCurrency: (state) => state.user?.preferredCurrency || 'USD',
    trialExpiresAt: (state) => state.user?.trialExpiresAt || null,
    subscriptionStatus: (state) => state.user?.subscriptionStatus || 'trial',
    isTrialExpired: (state) => {
      if (!state.user?.trialExpiresAt) return false
      return new Date(state.user.trialExpiresAt) < new Date()
    },
    hasActiveAccess: (state) => {
      if (state.user?.isAdmin) return true
      if (state.user?.subscriptionStatus === 'active') return true
      if (!state.user?.trialExpiresAt) return true
      return new Date(state.user.trialExpiresAt) >= new Date()
    },
    
    // Terminology based on business type
    terminology: (state) => {
      const type = state.user?.businessType || 'airbnb'
      return type === 'tour' ? {
        guest: 'Client',
        property: 'Destination',
        checkIn: 'Start Date',
        checkOut: 'End Date',
        arrival: 'Trip Start',
        checkout: 'Trip End',
        checkedIn: 'In Progress',
        checkedOut: 'Completed'
      } : {
        guest: 'Guest',
        property: 'Property',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        arrival: 'Arrival',
        checkout: 'Checkout',
        checkedIn: 'Checked In',
        checkedOut: 'Checked Out'
      }
    },
    
    // Get display status based on business type
    getDisplayStatus: (state) => (status) => {
      const type = state.user?.businessType || 'airbnb'
      if (type === 'tour') {
        if (status === 'Checked In') return 'In Progress'
        if (status === 'Checked Out') return 'Completed'
      }
      return status
    }
  },

  actions: {
    async register(email, password, businessName, businessType, preferredCurrency) {
      const response = await api.auth.register({ email, password, businessName, businessType, preferredCurrency })
      this.setAuth(response.data.token, response.data.user)
      return response.data
    },

    async login(credentials) {
      const response = await api.auth.login(credentials)
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
      this.showPaywall = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    togglePaywall(show) {
      this.showPaywall = show
    }
  }
})
