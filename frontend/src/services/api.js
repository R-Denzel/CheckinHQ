import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

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
  }
}
