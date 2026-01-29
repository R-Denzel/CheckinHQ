<template>
  <v-container class="pb-16">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h5 font-weight-bold">Today</h1>
            <p class="text-caption text-grey">{{ currentDate }}</p>
          </div>
          <v-btn
            icon
            variant="text"
            @click="handleLogout"
            title="Logout"
          >
            <v-icon>mdi-logout</v-icon>
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
      <!-- Arrivals Today -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon color="success" class="mr-2">mdi-login</v-icon>
              Arrivals Today
              <v-chip class="ml-2" size="small" color="success">
                {{ dashboard.arrivalsToday.length }}
              </v-chip>
            </v-card-title>
            <v-card-text v-if="dashboard.arrivalsToday.length === 0">
              <p class="text-grey">No arrivals today</p>
            </v-card-text>
            <v-list v-else>
              <BookingListItem
                v-for="booking in dashboard.arrivalsToday"
                :key="booking.id"
                :booking="booking"
              />
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Checkouts Today -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon color="info" class="mr-2">mdi-logout</v-icon>
              Checkouts Today
              <v-chip class="ml-2" size="small" color="info">
                {{ dashboard.checkoutsToday.length }}
              </v-chip>
            </v-card-title>
            <v-card-text v-if="dashboard.checkoutsToday.length === 0">
              <p class="text-grey">No checkouts today</p>
            </v-card-text>
            <v-list v-else>
              <BookingListItem
                v-for="booking in dashboard.checkoutsToday"
                :key="booking.id"
                :booking="booking"
              />
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Follow-ups Needed -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon color="warning" class="mr-2">mdi-clock-alert</v-icon>
              Follow-ups Needed
              <v-chip class="ml-2" size="small" color="warning">
                {{ dashboard.followUpsNeeded.length }}
              </v-chip>
            </v-card-title>
            <v-card-text v-if="dashboard.followUpsNeeded.length === 0">
              <p class="text-grey">All caught up!</p>
            </v-card-text>
            <v-list v-else>
              <BookingListItem
                v-for="booking in dashboard.followUpsNeeded"
                :key="booking.id"
                :booking="booking"
                show-last-contacted
              />
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Payments Pending -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon color="accent" class="mr-2">mdi-cash-clock</v-icon>
              Payments Pending
              <v-chip class="ml-2" size="small" color="accent">
                {{ dashboard.paymentsPending.length }}
              </v-chip>
            </v-card-title>
            <v-card-text v-if="dashboard.paymentsPending.length === 0">
              <p class="text-grey">No pending payments</p>
            </v-card-text>
            <v-list v-else>
              <BookingListItem
                v-for="booking in dashboard.paymentsPending"
                :key="booking.id"
                :booking="booking"
                show-payment
              />
            </v-list>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'
import { useAuthStore } from '@/stores/auth'
import BookingListItem from '@/components/BookingListItem.vue'

const router = useRouter()
const bookingStore = useBookingStore()
const authStore = useAuthStore()

const dashboard = computed(() => bookingStore.dashboard)
const loading = computed(() => bookingStore.loading)
const error = computed(() => bookingStore.error)

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    await bookingStore.fetchDashboard()
  } catch (err) {
    console.error('Failed to load dashboard:', err)
  }
})
</script>
