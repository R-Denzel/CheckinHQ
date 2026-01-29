<template>
  <v-list-item
    :to="`/bookings/${booking.id}`"
    class="booking-item"
  >
    <template v-slot:prepend>
      <v-avatar :color="statusColor" size="48">
        <v-icon color="white">{{ statusIcon }}</v-icon>
      </v-avatar>
    </template>

    <v-list-item-title class="font-weight-bold">
      {{ booking.guest_name }}
    </v-list-item-title>

    <v-list-item-subtitle>
      <div class="d-flex flex-column">
        <span>{{ booking.property_destination }}</span>
        <span class="text-caption">
          {{ formatDate(booking.check_in_date) }} → {{ formatDate(booking.check_out_date) }}
        </span>
        
        <!-- Last contacted info -->
        <span v-if="showLastContacted && booking.last_contacted_at" class="text-caption text-warning">
          Last contact: {{ timeSince(booking.last_contacted_at) }}
        </span>
        <span v-if="showLastContacted && !booking.last_contacted_at" class="text-caption text-error">
          Never contacted
        </span>

        <!-- Payment info -->
        <span v-if="showPayment" class="text-caption">
          Paid: ${{ booking.deposit_amount || 0 }} / ${{ booking.total_amount || 0 }}
        </span>
      </div>
    </v-list-item-subtitle>

    <template v-slot:append>
      <div class="d-flex flex-column align-end">
        <v-chip :color="statusColor" size="small" class="mb-1">
          {{ booking.status }}
        </v-chip>
        <v-btn
          icon
          size="small"
          color="success"
          :href="whatsappLink"
          target="_blank"
          @click.prevent="openWhatsApp"
        >
          <v-icon>mdi-whatsapp</v-icon>
        </v-btn>
      </div>
    </template>
  </v-list-item>
</template>

<script setup>
import { computed } from 'vue'
import { useBookingStore } from '@/stores/booking'

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

const bookingStore = useBookingStore()

// Status color mapping
const statusColor = computed(() => {
  const colors = {
    'Inquiry': 'grey',
    'Quoted': 'info',
    'Deposit Paid': 'accent',
    'Confirmed': 'success',
    'Checked In': 'primary',
    'Checked Out': 'grey-darken-1'
  }
  return colors[props.booking.status] || 'grey'
})

// Status icon mapping
const statusIcon = computed(() => {
  const icons = {
    'Inquiry': 'mdi-help-circle',
    'Quoted': 'mdi-file-document',
    'Deposit Paid': 'mdi-cash',
    'Confirmed': 'mdi-check-circle',
    'Checked In': 'mdi-login',
    'Checked Out': 'mdi-logout'
  }
  return icons[props.booking.status] || 'mdi-bookmark'
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
.booking-item {
  border-bottom: 1px solid #e0e0e0;
}
</style>
