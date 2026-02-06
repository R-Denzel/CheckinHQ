<template>
  <div style="background-color: #F0F2F5; min-height: 100vh;">
    <!-- Trial Banner -->
    <v-alert
      v-if="!authStore.isAdmin && authStore.subscriptionStatus === 'trial' && !hideBanner"
      type="info"
      variant="tonal"
      class="ma-0"
      density="compact"
      closable
      @click:close="hideBanner = true"
    >
      <template v-slot:prepend>
        <v-icon>mdi-clock-outline</v-icon>
      </template>
      Free trial - {{ trialDaysRemaining }} days remaining
      <template v-slot:append>
        <v-btn size="small" variant="text" @click="showSubscribe = true">Subscribe</v-btn>
      </template>
    </v-alert>

    <!-- WhatsApp-inspired Header -->
    <div class="whatsapp-header" style="padding: 20px 16px 16px 16px; position: sticky; top: 0; z-index: 10;">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h5 font-weight-bold" style="color: white; margin-bottom: 2px;">
            Today
          </h1>
          <p class="text-caption" style="color: rgba(255,255,255,0.8);">
            {{ currentDate }}
          </p>
        </div>
        <v-btn
          icon
          variant="text"
          @click="handleLogout"
          style="color: white;"
        >
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Content -->
    <v-container fluid style="padding: 0; padding-bottom: 80px;">
      <!-- Loading State -->
      <div v-if="loading" class="text-center pa-8">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Dashboard Content -->
      <div v-else-if="dashboard">
        <!-- Host Analytics Card -->
        <div style="padding: 12px 8px;">
          <HostAnalyticsCard ref="analyticsCard" />
        </div>

        <!-- Arrivals Today -->
        <div v-if="dashboard.arrivalsToday.length > 0">
          <div class="section-header">
            <v-icon size="16" class="mr-1">mdi-login</v-icon>
            {{ terminology.arrival }}s Today
            <v-chip size="x-small" color="success" variant="flat" class="ml-2" style="height: 18px;">
              {{ dashboard.arrivalsToday.length }}
            </v-chip>
          </div>
          <div style="background: white;">
            <BookingListItem
              v-for="booking in dashboard.arrivalsToday"
              :key="booking.id"
              :booking="booking"
            />
          </div>
        </div>

        <!-- Checkouts Today -->
        <div v-if="dashboard.checkoutsToday.length > 0" class="mt-2">
          <div class="section-header">
            <v-icon size="16" class="mr-1">mdi-logout</v-icon>
            {{ terminology.checkout }}s Today
            <v-chip size="x-small" color="info" variant="flat" class="ml-2" style="height: 18px;">
              {{ dashboard.checkoutsToday.length }}
            </v-chip>
          </div>
          <div style="background: white;">
            <BookingListItem
              v-for="booking in dashboard.checkoutsToday"
              :key="booking.id"
              :booking="booking"
            />
          </div>
        </div>

        <!-- Follow-ups Needed -->
        <div v-if="dashboard.followUpsNeeded.length > 0" class="mt-2">
          <div class="section-header">
            <v-icon size="16" class="mr-1">mdi-clock-alert-outline</v-icon>
            Follow-ups Needed
            <v-chip size="x-small" color="warning" variant="flat" class="ml-2" style="height: 18px;">
              {{ dashboard.followUpsNeeded.length }}
            </v-chip>
          </div>
          <div style="background: white;">
            <BookingListItem
              v-for="booking in dashboard.followUpsNeeded"
              :key="booking.id"
              :booking="booking"
              show-last-contacted
            />
          </div>
        </div>

        <!-- Payments Pending -->
        <div v-if="dashboard.paymentsPending.length > 0" class="mt-2">
          <div class="section-header">
            <v-icon size="16" class="mr-1">mdi-cash-clock</v-icon>
            Payments Pending
            <v-chip size="x-small" color="warning" variant="flat" class="ml-2" style="height: 18px;">
              {{ dashboard.paymentsPending.length }}
            </v-chip>
          </div>
          <div style="background: white;">
            <BookingListItem
              v-for="booking in dashboard.paymentsPending"
              :key="booking.id"
              :booking="booking"
              show-payment
            />
          </div>
        </div>

        <!-- All Caught Up Message -->
        <div 
          v-if="dashboard.arrivalsToday.length === 0 && 
                dashboard.checkoutsToday.length === 0 && 
                dashboard.followUpsNeeded.length === 0 && 
                dashboard.paymentsPending.length === 0"
          class="text-center pa-12"
        >
          <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
          <h3 class="text-h6 mb-2" style="color: #667781;">All Caught Up!</h3>
          <p class="text-body-2" style="color: #8696A0;">
            No bookings or tasks for today
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" style="padding: 16px;">
        <v-alert type="error" variant="tonal">{{ error }}</v-alert>
      </div>
    </v-container>

    <!-- Paywall Dialog -->
    <PaywallDialog
      v-model:show="showPaywallDialog"
      :trial-expires-at="authStore.trialExpiresAt"
      :subscription-status="authStore.subscriptionStatus"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'
import { useAuthStore } from '@/stores/auth'
import BookingListItem from '@/components/BookingListItem.vue'
import HostAnalyticsCard from '@/components/HostAnalyticsCard.vue'
import PaywallDialog from '@/components/PaywallDialog.vue'

const router = useRouter()
const bookingStore = useBookingStore()
const authStore = useAuthStore()

const terminology = computed(() => authStore.terminology)

const dashboard = computed(() => bookingStore.dashboard)
const loading = computed(() => bookingStore.loading)
const error = computed(() => bookingStore.error)
const analyticsCard = ref(null)
const showSubscribe = ref(false)
const showPaywallDialog = computed({
  get: () => authStore.showPaywall || showSubscribe.value,
  set: (value) => {
    if (!value) {
      showSubscribe.value = false
      authStore.togglePaywall(false)
    }
  }
})
const hideBanner = ref(false)

const trialDaysRemaining = computed(() => {
  if (!authStore.trialExpiresAt) return 0
  const expiresAt = new Date(authStore.trialExpiresAt)
  const now = new Date()
  const diff = expiresAt - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
})

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
  await bookingStore.fetchDashboard()
  // Refresh analytics when dashboard loads
  if (analyticsCard.value) {
    analyticsCard.value.refresh()
  }
})
</script>
