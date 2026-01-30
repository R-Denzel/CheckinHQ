import { defineStore } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from './auth'

/**
 * Booking Store
 * Manages booking data and operations
 */
export const useBookingStore = defineStore('booking', {
  state: () => ({
    bookings: [],
    currentBooking: null,
    dashboard: null,
    loading: false,
    error: null
  }),

  getters: {
    getBookingById: (state) => (id) => {
      return state.bookings.find(b => b.id === parseInt(id))
    }
  },

  actions: {
    async fetchBookings(filters = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await api.bookings.getAll(filters)
        this.bookings = response.data.bookings
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch bookings'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchBooking(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.bookings.getOne(id)
        this.currentBooking = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch booking'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createBooking(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.bookings.create(data)
        this.bookings.unshift(response.data.booking)
        return response.data.booking
      } catch (error) {
        // Handle subscription errors
        if (error.response?.status === 403 && error.response?.data?.trialExpired) {
          const authStore = useAuthStore()
          authStore.togglePaywall(true)
        }
        this.error = error.response?.data?.error || 'Failed to create booking'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateBooking(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.bookings.update(id, data)
        const index = this.bookings.findIndex(b => b.id === parseInt(id))
        if (index !== -1) {
          this.bookings[index] = response.data.booking
        }
        return response.data.booking
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update booking'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteBooking(id) {
      this.loading = true
      this.error = null
      try {
        await api.bookings.delete(id)
        this.bookings = this.bookings.filter(b => b.id !== parseInt(id))
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to delete booking'
        throw error
      } finally {
        this.loading = false
      }
    },

    async markContacted(id) {
      try {
        const response = await api.bookings.markContacted(id)
        const index = this.bookings.findIndex(b => b.id === parseInt(id))
        if (index !== -1) {
          this.bookings[index] = response.data.booking
        }
      } catch (error) {
        console.error('Failed to mark contacted:', error)
      }
    },

    async addNote(id, noteText) {
      try {
        await api.bookings.addNote(id, noteText)
      } catch (error) {
        throw error
      }
    },

    async fetchDashboard() {
      this.loading = true
      this.error = null
      try {
        const response = await api.bookings.getDashboard()
        this.dashboard = response.data.dashboard
      } catch (error) {
        // Handle subscription errors
        if (error.response?.status === 403 && error.response?.data?.trialExpired) {
          const authStore = useAuthStore()
          authStore.togglePaywall(true)
        }
        this.error = error.response?.data?.error || 'Failed to fetch dashboard'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
