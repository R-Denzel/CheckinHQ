<template>
  <div 
    class="chat-card booking-card" 
    @click="navigateToBooking"
    style="cursor: pointer; padding: 12px 16px; margin-bottom: 2px;"
  >
    <div class="d-flex align-start">
      <!-- Avatar/Icon -->
      <div class="mr-3">
        <v-avatar :color="statusColor" size="52" style="border-radius: 50%;">
          <v-icon color="white" size="28">{{ statusIcon }}</v-icon>
        </v-avatar>
      </div>

      <!-- Content -->
      <div class="flex-grow-1" style="min-width: 0;">
        <!-- Guest Name & Date -->
        <div class="d-flex justify-space-between align-center mb-1">
          <h3 class="text-subtitle-1 font-weight-bold" style="color: #111B21; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ booking.guest_name }}
          </h3>
          <span class="text-caption" style="color: #667781; white-space: nowrap; margin-left: 8px;">
            {{ formatDate(booking.check_in_date) }}
          </span>
        </div>

        <!-- Property/Destination -->
        <p class="text-body-2 mb-1" style="color: #667781; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <v-icon size="14" style="color: #667781;">mdi-map-marker</v-icon>
          {{ booking.property_destination }}
        </p>

        <!-- Check-in/out dates -->
        <p class="text-caption mb-1" style="color: #8696A0;">
          {{ formatDate(booking.check_in_date) }} → {{ formatDate(booking.check_out_date) }}
        </p>

        <!-- Last contacted info -->
        <div v-if="showLastContacted" class="mb-1">
          <v-chip 
            v-if="booking.last_contacted_at" 
            size="x-small" 
            color="success"
            variant="flat"
            style="height: 20px; font-size: 11px;"
          >
            <v-icon size="12" start>mdi-check</v-icon>
            {{ timeSince(booking.last_contacted_at) }}
          </v-chip>
          <v-chip 
            v-else 
            size="x-small" 
            color="warning"
            variant="flat"
            style="height: 20px; font-size: 11px;"
          >
            <v-icon size="12" start>mdi-alert-circle</v-icon>
            Not contacted
          </v-chip>
        </div>

        <!-- Payment info -->
        <p v-if="showPayment" class="text-caption" style="color: #8696A0;">
          💰 {{ formatCurrency(booking.deposit_amount || 0, booking.currency) }} / {{ formatCurrency(booking.total_amount || 0, booking.currency) }}
        </p>

        <!-- Status & WhatsApp -->
        <div class="d-flex align-center justify-space-between mt-2">
          <v-chip 
            :color="statusColor" 
            size="small" 
            variant="flat"
            style="height: 24px; font-size: 12px; font-weight: 500;"
          >
            {{ displayStatus }}
          </v-chip>

          <v-btn
            icon
            size="small"
            elevation="0"
            style="background: #25D366;"
            @click.stop="openWhatsApp"
          >
            <v-icon color="white" size="20">mdi-whatsapp</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  },
  showLastContacted: {
    type: Boolean,
    default: false
  },
  showPayment: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const bookingStore = useBookingStore()
const authStore = useAuthStore()

// Get display status based on business type
const displayStatus = computed(() => {
  return authStore.getDisplayStatus(props.booking.status)
})

// Status color mapping - WhatsApp-inspired soft colors
const statusColor = computed(() => {
  const colors = {
    'Inquiry': '#8696A0',
    'Quoted': '#06BEE1',
    'Deposit Paid': '#F77F00',
    'Confirmed': '#25D366',
    'Checked In': '#128C7E',
    'Checked Out': '#667781'
  }
  return colors[props.booking.status] || '#8696A0'
})

// Status icon mapping
const statusIcon = computed(() => {
  const icons = {
    'Inquiry': 'mdi-help-circle-outline',
    'Quoted': 'mdi-file-document-outline',
    'Deposit Paid': 'mdi-cash-check',
    'Confirmed': 'mdi-check-circle',
    'Checked In': 'mdi-home-account',
    'Checked Out': 'mdi-check-all'
  }
  return icons[props.booking.status] || 'mdi-bookmark-outline'
})

// WhatsApp link
const whatsappLink = computed(() => {
  const phone = props.booking.phone_number.replace(/\D/g, '')
  return `https://wa.me/${phone}`
})

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Time since helper
const timeSince = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Navigate to booking
const navigateToBooking = () => {
  router.push(`/bookings/${props.booking.id}`)
}

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  const symbols = { USD: '$', UGX: 'USh', KES: 'KSh', TZS: 'TSh', EUR: '€', GBP: '£' }
  const symbol = symbols[currency] || '$'
  return `${symbol}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// Open WhatsApp and mark as contacted
const openWhatsApp = async (event) => {
  event.stopPropagation()
  
  // Mark as contacted
  await bookingStore.markContacted(props.booking.id)
  
  // Open WhatsApp
  window.open(whatsappLink.value, '_blank')
}
</script>

<style scoped>
.booking-card {
  transition: all 0.15s ease;
}

.booking-card:active {
  background: #F5F6F6;
  transform: scale(0.99);
}
</style>
