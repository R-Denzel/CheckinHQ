<template>
  <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)" max-width="500" persistent>
    <v-card class="text-center pa-6">
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        style="position: absolute; top: 8px; right: 8px;"
        @click="$emit('update:show', false)"
      />
      <v-icon size="80" color="warning" class="mb-4">
        mdi-lock-clock
      </v-icon>
      
      <h2 class="text-h5 font-weight-bold mb-2">Trial Expired</h2>
      
      <p class="text-body-1 mb-4" style="color: #667781;">
        Your CheckinHQ trial has ended. Subscribe to keep managing bookings.
      </p>
      
      <v-card color="#F0F2F5" flat class="pa-4 mb-4">
        <div class="d-flex justify-space-between mb-2">
          <span class="font-weight-medium">Trial ended:</span>
          <span>{{ formatDate(trialExpiresAt) }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="font-weight-medium">Status:</span>
          <v-chip size="small" color="error">{{ subscriptionStatus }}</v-chip>
        </div>
      </v-card>
      
      <v-divider class="my-4" />
      
      <h3 class="text-h6 mb-3">Continue with CheckinHQ</h3>
      
      <v-card variant="outlined" class="pa-4 mb-3" :color="selectedPlan === 'monthly' ? 'primary' : ''">
        <div class="d-flex justify-space-between align-center">
          <div class="text-left">
            <div class="text-h6 font-weight-bold">KSh 1,000/month</div>
            <div class="text-caption">Unlimited bookings • Pay monthly</div>
          </div>
          <v-btn 
            :color="selectedPlan === 'monthly' ? 'primary' : 'default'" 
            :variant="selectedPlan === 'monthly' ? 'flat' : 'outlined'"
            size="large" 
            @click="selectPlan('monthly')"
          >
            {{ selectedPlan === 'monthly' ? 'Selected' : 'Select' }}
          </v-btn>
        </div>
      </v-card>
      
      <v-card variant="outlined" class="pa-4 mb-3" :color="selectedPlan === 'yearly' ? 'primary' : ''">
        <div class="d-flex justify-space-between align-center">
          <div class="text-left">
            <div class="d-flex align-center gap-2">
              <div class="text-h6 font-weight-bold">KSh 10,000/year</div>
              <v-chip size="x-small" color="success">Save 17%</v-chip>
            </div>
            <div class="text-caption">Unlimited bookings • Pay yearly</div>
          </div>
          <v-btn 
            :color="selectedPlan === 'yearly' ? 'primary' : 'default'" 
            :variant="selectedPlan === 'yearly' ? 'flat' : 'outlined'"
            size="large" 
            @click="selectPlan('yearly')"
          >
            {{ selectedPlan === 'yearly' ? 'Selected' : 'Select' }}
          </v-btn>
        </div>
      </v-card>
      
      <v-btn 
        color="primary" 
        size="x-large" 
        block 
        class="mb-4"
        :loading="paymentLoading"
        :disabled="!selectedPlan"
        @click="subscribe"
      >
        <v-icon left>mdi-credit-card</v-icon>
        Pay with M-Pesa / Card
      </v-btn>
      
      <p class="text-caption text-grey mb-2">
        Secure payment via Pesapal
      </p>
      
      <v-btn variant="text" @click="logout" color="grey">
        Logout
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  trialExpiresAt: {
    type: String,
    default: null
  },
  subscriptionStatus: {
    type: String,
    default: 'expired'
  }
})

const emit = defineEmits(['update:show'])

const router = useRouter()
const authStore = useAuthStore()
const selectedPlan = ref('monthly')
const paymentLoading = ref(false)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const selectPlan = (plan) => {
  selectedPlan.value = plan
}

const subscribe = async () => {
  if (!selectedPlan.value) {
    alert('Please select a plan')
    return
  }
  
  paymentLoading.value = true
  
  try {
    // Initialize payment with Pesapal
    const response = await api.payments.initializePayment(selectedPlan.value)
    
    if (response.data.success && response.data.redirectUrl) {
      // Store order tracking ID for verification
      localStorage.setItem('pendingPayment', response.data.orderTrackingId)
      
      // Redirect to Pesapal payment page
      window.location.href = response.data.redirectUrl
    } else {
      throw new Error('Failed to initialize payment')
    }
  } catch (error) {
    console.error('Payment error:', error)
    alert('Failed to initialize payment. Please try again or contact support.')
    paymentLoading.value = false
  }
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
