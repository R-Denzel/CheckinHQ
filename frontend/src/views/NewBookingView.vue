<template>
  <v-container class="pb-16">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center">
          <v-btn icon variant="text" @click="$router.back()">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h1 class="text-h5 font-weight-bold ml-2">New Booking</h1>
        </div>
      </v-col>
    </v-row>

    <!-- Stepper -->
    <v-row>
      <v-col>
        <v-stepper v-model="step" :items="['Guest', 'Stay', 'Payment']" flat>
          <template v-slot:item.1>
            <v-card flat class="pa-4">
              <h3 class="text-h6 mb-4">Guest Information</h3>
              
              <v-text-field
                v-model="formData.guestName"
                label="Guest Name"
                prepend-inner-icon="mdi-account"
                :rules="[rules.required]"
                required
              />

              <v-text-field
                v-model="formData.phoneNumber"
                label="Phone Number"
                prepend-inner-icon="mdi-phone"
                :rules="[rules.required]"
                hint="Include country code, e.g., +256"
                persistent-hint
                required
              />
            </v-card>
          </template>

          <template v-slot:item.2>
            <v-card flat class="pa-4">
              <h3 class="text-h6 mb-4">Stay Details</h3>

              <v-text-field
                v-model="formData.checkInDate"
                label="Check-in Date"
                type="date"
                prepend-inner-icon="mdi-calendar-import"
                :rules="[rules.required]"
                required
              />

              <v-text-field
                v-model="formData.checkOutDate"
                label="Check-out Date"
                type="date"
                prepend-inner-icon="mdi-calendar-export"
                :rules="[rules.required]"
                required
              />

              <v-text-field
                v-model="formData.propertyDestination"
                label="Property or Destination"
                prepend-inner-icon="mdi-map-marker"
                :rules="[rules.required]"
                placeholder="e.g., Lake View Cottage, Murchison Falls"
                required
              />

              <v-select
                v-model="formData.status"
                label="Status"
                :items="statusOptions"
                prepend-inner-icon="mdi-flag"
              />
            </v-card>
          </template>

          <template v-slot:item.3>
            <v-card flat class="pa-4">
              <h3 class="text-h6 mb-4">Payment & Notes</h3>

              <v-text-field
                v-model.number="formData.totalAmount"
                label="Total Amount"
                type="number"
                min="0"
                step="0.01"
                prepend-inner-icon="mdi-cash"
                prefix="$"
              />

              <v-text-field
                v-model.number="formData.depositAmount"
                label="Deposit Paid"
                type="number"
                min="0"
                step="0.01"
                prepend-inner-icon="mdi-cash-check"
                prefix="$"
              />

              <v-textarea
                v-model="formData.notes"
                label="Notes"
                prepend-inner-icon="mdi-note-text"
                rows="3"
                placeholder="Any important details..."
              />
            </v-card>
          </template>

          <template v-slot:actions>
            <v-btn
              v-if="step > 1"
              variant="outlined"
              @click="step--"
            >
              Back
            </v-btn>

            <v-spacer />

            <v-btn
              v-if="step < 3"
              color="primary"
              @click="step++"
            >
              Next
            </v-btn>

            <v-btn
              v-if="step === 3"
              color="success"
              @click="handleSubmit"
              :loading="loading"
            >
              Create Booking
            </v-btn>
          </template>
        </v-stepper>
      </v-col>
    </v-row>

    <!-- Error Message -->
    <v-row v-if="error">
      <v-col>
        <v-alert type="error" dismissible>{{ error }}</v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'

const router = useRouter()
const bookingStore = useBookingStore()

const step = ref(1)
const loading = ref(false)
const error = ref(null)

const formData = ref({
  guestName: '',
  phoneNumber: '',
  checkInDate: '',
  checkOutDate: '',
  propertyDestination: '',
  status: 'Inquiry',
  totalAmount: 0,
  depositAmount: 0,
  notes: ''
})

const statusOptions = [
  'Inquiry',
  'Quoted',
  'Deposit Paid',
  'Confirmed',
  'Checked In',
  'Checked Out'
]

const rules = {
  required: value => !!value || 'Required'
}

const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    await bookingStore.createBooking(formData.value)
    router.push('/bookings')
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create booking'
  } finally {
    loading.value = false
  }
}
</script>
