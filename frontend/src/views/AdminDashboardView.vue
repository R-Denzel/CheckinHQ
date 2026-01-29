<template>
  <v-container class="pb-16">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h5 font-weight-bold">Admin Dashboard</h1>
            <p class="text-caption text-grey">CheckinHQ Analytics - Last 7 Days</p>
          </div>
          <v-btn
            icon
            variant="text"
            @click="$router.push('/')"
            title="Back to Dashboard"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col>
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <!-- Dashboard Content -->
    <div v-else-if="dashboard">
      <!-- Key Metrics -->
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-card class="text-center pa-4" color="primary" dark>
            <div class="text-h3 font-weight-bold">{{ dashboard.activeHosts }}</div>
            <div class="text-subtitle-1">Active Hosts</div>
            <div class="text-caption">This Week</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="text-center pa-4" color="success" dark>
            <div class="text-h3 font-weight-bold">{{ dashboard.bookingsThisWeek }}</div>
            <div class="text-subtitle-1">Bookings Added</div>
            <div class="text-caption">This Week</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="text-center pa-4" color="accent" dark>
            <div class="text-h3 font-weight-bold">${{ formatNumber(dashboard.depositsThisWeek) }}</div>
            <div class="text-subtitle-1">Deposits Recorded</div>
            <div class="text-caption">This Week</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="text-center pa-4" color="info" dark>
            <div class="text-h3 font-weight-bold">{{ dashboard.followUpsCompleted }}</div>
            <div class="text-subtitle-1">Follow-ups Done</div>
            <div class="text-caption">This Week</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="text-center pa-4" elevation="2">
            <div class="text-h3 font-weight-bold primary--text">{{ dashboard.avgBookingsPerHost }}</div>
            <div class="text-subtitle-1">Avg Bookings/Host</div>
            <div class="text-caption text-grey">This Week</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="text-center pa-4" elevation="2">
            <div class="text-h3 font-weight-bold success--text">${{ formatNumber(dashboard.avgRevenuePerHost) }}</div>
            <div class="text-subtitle-1">Avg Revenue/Host</div>
            <div class="text-caption text-grey">This Week</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Weekly Trends -->
      <v-row v-if="trends && trends.length > 0" class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>Weekly Trends (Last 4 Weeks)</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th class="text-right">Bookings</th>
                    <th class="text-right">Deposits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="week in trends" :key="week.week_label">
                    <td>{{ week.week_label }}</td>
                    <td class="text-right font-weight-bold">{{ week.bookings }}</td>
                    <td class="text-right font-weight-bold success--text">
                      ${{ formatNumber(week.deposits) }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Individual User Stats -->
      <v-row v-if="userStats && userStats.length > 0" class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-account-group</v-icon>
              Individual Host Stats
            </v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Host</th>
                    <th>Business Type</th>
                    <th class="text-right">Total Bookings</th>
                    <th class="text-right">This Week</th>
                    <th class="text-right">Deposits (Week)</th>
                    <th class="text-right">Follow-ups (Week)</th>
                    <th class="text-right">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in userStats" :key="user.id">
                    <td>
                      <div class="font-weight-bold">{{ user.business_name || user.email }}</div>
                      <div class="text-caption text-grey">{{ user.email }}</div>
                    </td>
                    <td>
                      <v-chip size="small" variant="outlined">
                        {{ user.business_type === 'tour' ? 'Tour' : 'Airbnb' }}
                      </v-chip>
                    </td>
                    <td class="text-right font-weight-bold">{{ user.total_bookings }}</td>
                    <td class="text-right">
                      <v-chip 
                        size="small" 
                        :color="user.bookings_this_week > 0 ? 'success' : 'grey'"
                        variant="flat"
                      >
                        {{ user.bookings_this_week }}
                      </v-chip>
                    </td>
                    <td class="text-right success--text font-weight-bold">
                      ${{ formatNumber(user.deposits_this_week) }}
                    </td>
                    <td class="text-right">
                      <v-chip 
                        size="small" 
                        :color="user.follow_ups_this_week > 0 ? 'info' : 'grey'"
                        variant="flat"
                      >
                        {{ user.follow_ups_this_week }}
                      </v-chip>
                    </td>
                    <td class="text-right text-caption">
                      {{ formatDate(user.last_login_at || user.last_booking_date) }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Error State -->
    <v-row v-else-if="error">
      <v-col>
        <v-alert type="error">{{ error }}</v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const dashboard = ref(null)
const trends = ref([])
const userStats = ref([])
const loading = ref(false)
const error = ref(null)

const formatNumber = (num) => {
  return parseFloat(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const fetchDashboard = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.analytics.getAdmin()
    dashboard.value = response.data.dashboard
    trends.value = response.data.trends
    userStats.value = response.data.userStats || []
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load admin dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>
