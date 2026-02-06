import axios from 'axios'

// Use relative /api path in production (Vercel proxy), full URL in development
const API_URL = import.meta.env.PROD 
  ? '/api'  // Production: Use Vercel proxy
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')  // Development: Use full URL

/**
 * API Service
 * Centralized API communication with authentication
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    if (error.response?.status === 403 && error.response?.data?.trialExpired) {
      // Trial expired - will be handled by component
      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

export default {
  // Auth
  auth: {
    register(data) {
      return apiClient.post('/auth/register', data)
    },
    login(data) {
      return apiClient.post('/auth/login', data)
    },
    getProfile() {
      return apiClient.get('/auth/me')
    },
    verifyEmail(token) {
      return apiClient.post('/auth/verify-email', { token })
    },
    resendVerification() {
      return apiClient.post('/auth/resend-verification')
    },
    forgotPassword(email) {
      return apiClient.post('/auth/forgot-password', { email })
    },
    resetPassword(token, password) {
      return apiClient.post('/auth/reset-password', { token, password })
    }
  },

  // Bookings
  bookings: {
    getAll(params) {
      return apiClient.get('/bookings', { params })
    },
    getOne(id) {
      return apiClient.get(`/bookings/${id}`)
    },
    create(data) {
      return apiClient.post('/bookings', data)
    },
    update(id, data) {
      return apiClient.put(`/bookings/${id}`, data)
    },
    delete(id) {
      return apiClient.delete(`/bookings/${id}`)
    },
    markContacted(id) {
      return apiClient.post(`/bookings/${id}/contact`)
    },
    addNote(id, noteText) {
      return apiClient.post(`/bookings/${id}/notes`, { noteText })
    },
    getDashboard() {
      return apiClient.get('/bookings/dashboard/today')
    }
  },

  // Analytics
  analytics: {
    getHostAnalytics() {
      return apiClient.get('/analytics/host')
    },
    getAdmin() {
      return apiClient.get('/analytics/admin')
    }
  },

  // Subscription
  subscription: {
    getStatus() {
      return apiClient.get('/subscription/status')
    },
    activate(userId) {
      return apiClient.post(`/subscription/activate/${userId}`)
    },
    deactivate(userId) {
      return apiClient.post(`/subscription/deactivate/${userId}`)
    },
    toggle(userId) {
      return apiClient.post(`/subscription/toggle/${userId}`)
    },
    getUsers() {
      return apiClient.get('/subscription/users')
    }
  },

  // Direct POST method for compatibility
  post(url, data) {
    return apiClient.post(url, data)
  }
}
