<template>
  <v-card class="mb-4" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="mr-2">mdi-chart-box</v-icon>
      This Month's Performance
    </v-card-title>
    
    <v-card-text v-if="loading">
      <v-progress-circular indeterminate color="primary" size="32" />
    </v-card-text>

    <v-card-text v-else-if="analytics">
      <v-row dense>
        <!-- Total Bookings -->
        <v-col cols="6">
          <div class="text-center pa-3">
            <div class="text-h4 font-weight-bold primary--text">
              {{ analytics.total_bookings_this_month }}
            </div>
            <div class="text-caption text-grey">
              Total {{ terminology.guest }}s
            </div>
          </div>
        </v-col>

        <!-- Total Deposits -->
        <v-col cols="6">
          <div class="text-center pa-3">
            <div class="text-h4 font-weight-bold success--text">
              {{ formatCurrency(analytics.total_deposits_this_month) }}
            </div>
            <div class="text-caption text-grey">
              Deposits Recorded
            </div>
          </div>
        </v-col>

        <!-- Follow-up Completion Rate -->
        <v-col cols="12">
          <v-divider class="my-2" />
          <div class="pa-3">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-body-2">Follow-up Completion</span>
              <span class="text-h6 font-weight-bold">
                {{ analytics.follow_up_completion_rate }}%
              </span>
            </div>
            <v-progress-linear
              :model-value="analytics.follow_up_completion_rate"
              :color="getProgressColor(analytics.follow_up_completion_rate)"
              height="8"
              rounded
            />
            <div class="text-caption text-grey mt-1">
              {{ analytics.follow_ups_completed }} of {{ analytics.follow_ups_total }} completed
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()
const terminology = computed(() => authStore.terminology)

const analytics = ref(null)
const loading = ref(false)

const formatNumber = (num) => {
  return parseFloat(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

const formatCurrency = (amount) => {
  const currency = authStore.preferredCurrency
  const symbols = { USD: '$', UGX: 'USh', KES: 'KSh', TZS: 'TSh', EUR: '€', GBP: '£' }
  const symbol = symbols[currency] || '$'
  return `${symbol}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const getProgressColor = (rate) => {
  if (rate >= 80) return 'success'
  if (rate >= 50) return 'warning'
  return 'error'
}

const fetchAnalytics = async () => {
  loading.value = true
  try {
    const response = await api.analytics.getHostAnalytics()
    analytics.value = response.data.analytics
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAnalytics)

// Expose refresh function for parent components
defineExpose({ refresh: fetchAnalytics })
</script>
