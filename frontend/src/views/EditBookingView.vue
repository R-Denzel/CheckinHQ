<template>
  <v-container class="pb-16">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center">
          <v-btn icon variant="text" @click="$router.back()">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h1 class="text-h5 font-weight-bold ml-2">Edit Booking</h1>
        </div>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading && !formData.guestName">
      <v-col>
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <!-- Edit Form -->
    <v-row v-else>
      <v-col cols="12">
        <v-card class="pa-4">
          <v-form @submit.prevent="handleSubmit">
            <h3 class="text-h6 mb-4">{{ terminology.guest }} Information</h3>
            
            <v-text-field
              v-model="formData.guestName"
              :label="terminology.guest + ' Name'"
              prepend-inner-icon="mdi-account"
              required
            />

            <v-text-field
              v-model="formData.phoneNumber"
              label="Phone Number"
              prepend-inner-icon="mdi-phone"
              required
            />

            <v-divider class="my-4" />
            <h3 class="text-h6 mb-4">Stay Details</h3>

            <v-text-field
              v-model="formData.checkInDate"
              :label="terminology.checkIn + ' Date'"
              type="date"
              prepend-inner-icon="mdi-calendar-import"
              :min="today"
              required
            />

            <v-text-field
              v-model="formData.checkOutDate"
              :label="terminology.checkOut + ' Date'"
              type="date"
              prepend-inner-icon="mdi-calendar-export"
              :min="formData.checkInDate || today"
              required
            />

            <v-text-field
              v-model="formData.propertyDestination"
              :label="terminology.property"
              prepend-inner-icon="mdi-map-marker"
              required
            />

            <v-select
              v-model="formData.status"
              label="Status"
              :items="statusOptions"
              prepend-inner-icon="mdi-flag"
            />

            <v-divider class="my-4" />
            <h3 class="text-h6 mb-4">Payment</h3>

            <v-select
              v-model="formData.currency"
              label="Currency"
              :items="currencyOptions"
              prepend-inner-icon="mdi-currency-usd"
            />

            <v-text-field
              v-model.number="formData.totalAmount"
              label="Total Amount"
              type="number"
              min="0"
              step="0.01"
              prepend-inner-icon="mdi-cash"
              :prefix="currencySymbol"
              :error="depositExceedsTotal"
              :hint="depositExceedsTotal ? 'Deposit cannot exceed total amount' : ''"
              persistent-hint
            />

            <v-text-field
              v-model.number="formData.depositAmount"
              label="Deposit Paid"
              type="number"
              min="0"
              step="0.01"
              prepend-inner-icon="mdi-cash-check"
              :prefix="currencySymbol"
              :error="depositExceedsTotal"
              :hint="depositExceedsTotal ? 'Deposit cannot exceed total amount' : ''"
              persistent-hint
            />

            <!-- Error Message -->
            <v-alert v-if="error" type="error" class="mb-4" dismissible>
              {{ error }}
            </v-alert>

            <!-- Actions -->
            <div class="d-flex gap-2">
              <v-btn
                variant="outlined"
                @click="$router.back()"
                :disabled="submitting"
              >
                Cancel
              </v-btn>
              <v-spacer />
              <v-btn
                type="submit"
                color="success"
                :loading="submitting"
              >
                Save Changes
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const authStore = useAuthStore()
const terminology = computed(() => authStore.terminology)

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0]

const loading = ref(false)
const submitting = ref(false)
const error = ref(null)

const formData = ref({
  guestName: '',
  phoneNumber: '',
  checkInDate: '',
  checkOutDate: '',
  propertyDestination: '',
  status: 'Inquiry',
  currency: 'USD',
  totalAmount: 0,
  depositAmount: 0
})

const statusOptions = [
  'Inquiry',
  'Quoted',
  'Deposit Paid',
  'Confirmed',
  'Checked In',
  'Checked Out'
]

const currencyOptions = [
  { title: 'USD - US Dollar', value: 'USD' },
  { title: 'UGX - Ugandan Shilling', value: 'UGX' },
  { title: 'KES - Kenyan Shilling', value: 'KES' },
  { title: 'TZS - Tanzanian Shilling', value: 'TZS' },
  { title: 'EUR - Euro', value: 'EUR' },
  { title: 'GBP - British Pound', value: 'GBP' }
]

const currencySymbol = computed(() => {
  const symbols = { USD: '$', UGX: 'USh', KES: 'KSh', TZS: 'TSh', EUR: '€', GBP: '£' }
  return symbols[formData.value.currency] || '$'
})

const depositExceedsTotal = computed(() => {
  return formData.value.depositAmount > 0 && 
         formData.value.totalAmount > 0 && 
         formData.value.depositAmount > formData.value.totalAmount
})

const loadBooking = async () => {
  loading.value = true
  try {
    const data = await bookingStore.fetchBooking(route.params.id)
    const booking = data.booking
    
    // Populate form
    formData.value = {
      guestName: booking.guest_name,
      phoneNumber: booking.phone_number,
      checkInDate: booking.check_in_date,
      checkOutDate: booking.check_out_date,
      propertyDestination: booking.property_destination,
      status: booking.status,
      currency: booking.currency || 'USD',
      totalAmount: booking.total_amount,
      depositAmount: booking.deposit_amount
    }
  } catch (err) {
    error.value = 'Failed to load booking'
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (depositExceedsTotal.value) {
    error.value = 'Deposit amount cannot exceed total amount'
    return
  }
  
  submitting.value = true
  error.value = null

  try {
    await bookingStore.updateBooking(route.params.id, formData.value)
    router.push(`/bookings/${route.params.id}`)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update booking'
  } finally {
    submitting.value = false
  }
}

onMounted(loadBooking)
</script>
