<template>
  <v-container class="pb-16">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h5 font-weight-bold">All Bookings</h1>
      </v-col>
    </v-row>

    <!-- Filter Chips -->
    <v-row class="mb-2">
      <v-col>
        <v-chip-group
          v-model="selectedStatus"
          selected-class="text-primary"
          column
        >
          <v-chip value="" variant="outlined">All</v-chip>
          <v-chip value="Inquiry" variant="outlined">Inquiry</v-chip>
          <v-chip value="Quoted" variant="outlined">Quoted</v-chip>
          <v-chip value="Confirmed" variant="outlined">Confirmed</v-chip>
          <v-chip value="Checked In" variant="outlined">{{ terminology.checkedIn }}</v-chip>
          <v-chip value="Checked Out" variant="outlined">{{ terminology.checkedOut }}</v-chip>
        </v-chip-group>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col>
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <!-- Bookings List -->
    <v-row v-else-if="bookings && bookings.length > 0">
      <v-col cols="12">
        <v-card>
          <v-list>
            <BookingListItem
              v-for="booking in bookings"
              :key="booking.id"
              :booking="booking"
            />
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else>
      <v-col>
        <v-card class="pa-8 text-center">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">
            mdi-calendar-blank
          </v-icon>
          <h3 class="text-h6 mb-2">No bookings yet</h3>
          <p class="text-grey mb-4">Start by adding your first booking</p>
          <v-btn color="primary" to="/bookings/new" size="large">
            <v-icon left>mdi-plus</v-icon>
            Add Booking
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-if="error">
      <v-col>
        <v-alert type="error">{{ error }}</v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBookingStore } from '@/stores/booking'
import { useAuthStore } from '@/stores/auth'
import BookingListItem from '@/components/BookingListItem.vue'

const bookingStore = useBookingStore()
const authStore = useAuthStore()

const selectedStatus = ref('')
const bookings = computed(() => bookingStore.bookings)
const loading = computed(() => bookingStore.loading)
const error = computed(() => bookingStore.error)

// Get terminology for business type
const terminology = computed(() => authStore.terminology)

// Fetch bookings when filter changes
watch(selectedStatus, async (newStatus) => {
  const filters = newStatus ? { status: newStatus } : {}
  await bookingStore.fetchBookings(filters)
})

onMounted(async () => {
  await bookingStore.fetchBookings()
})
</script>
