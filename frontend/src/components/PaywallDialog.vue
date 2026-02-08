<template>
  <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)" max-width="700" persistent scrollable>
    <v-card class="text-center pa-8">
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        style="position: absolute; top: 12px; right: 12px; z-index: 1;"
        @click="$emit('update:show', false)"
      />
      <v-icon size="80" color="warning" class="mb-4">
        mdi-lock-clock
      </v-icon>
      
      <h2 class="text-h4 font-weight-bold mb-3">Trial Expired</h2>
      
      <p class="text-body-1 mb-6" style="color: #667781; max-width: 500px; margin: 0 auto;">
        Your CheckinHQ trial has ended. Subscribe to keep managing bookings.
      </p>
      
      <v-card color="#F0F2F5" flat class="pa-4 mb-6" style="max-width: 400px; margin: 0 auto;">
        <div class="d-flex justify-space-between mb-2">
          <span class="font-weight-medium">Trial ended:</span>
          <span>{{ formatDate(trialExpiresAt) }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="font-weight-medium">Status:</span>
          <v-chip size="small" color="error">{{ subscriptionStatus }}</v-chip>
        </div>
      </v-card>
      
      <v-divider class="my-6" />
      
      <h3 class="text-h5 mb-6">Continue with CheckinHQ</h3>
      
      <!-- Pricing Cards -->
      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-card 
            variant="outlined" 
            class="pa-6 cursor-pointer pricing-card h-100" 
            :class="{ 'selected-plan': selectedPlan === 'monthly' }"
            :color="selectedPlan === 'monthly' ? 'primary' : ''"
            @click="selectPlan('monthly')"
          >
            <div class="d-flex flex-column align-center text-center h-100">
              <div class="mb-4">
                <div class="text-h4 font-weight-bold mb-2">{{ pricing.monthly }}</div>
                <div class="text-subtitle-1 text-grey">per month</div>
              </div>
              <div class="mb-4">
                <div class="text-body-2 mb-1">✓ Unlimited bookings</div>
                <div class="text-body-2">✓ Pay monthly</div>
              </div>
              <v-spacer />
              <v-btn 
                :color="selectedPlan === 'monthly' ? 'primary' : 'default'" 
                :variant="selectedPlan === 'monthly' ? 'flat' : 'outlined'"
                size="large"
                block
                class="mt-4"
              >
                {{ selectedPlan === 'monthly' ? '✓ Selected' : 'Select Plan' }}
              </v-btn>
            </div>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-card 
            variant="outlined" 
            class="pa-6 cursor-pointer pricing-card h-100" 
            :class="{ 'selected-plan': selectedPlan === 'yearly' }"
            :color="selectedPlan === 'yearly' ? 'primary' : ''"
            @click="selectPlan('yearly')"
          >
            <v-chip 
              size="small" 
              color="success" 
              class="best-value-chip"
              style="position: absolute; top: -12px; right: 20px;"
            >
              Save 17%
            </v-chip>
            <div class="d-flex flex-column align-center text-center h-100">
              <div class="mb-4">
                <div class="text-h4 font-weight-bold mb-2">{{ pricing.yearly }}</div>
                <div class="text-subtitle-1 text-grey">per year</div>
              </div>
              <div class="mb-4">
                <div class="text-body-2 mb-1">✓ Unlimited bookings</div>
                <div class="text-body-2">✓ Pay yearly & save</div>
              </div>
              <v-spacer />
              <v-btn 
                :color="selectedPlan === 'yearly' ? 'primary' : 'default'" 
                :variant="selectedPlan === 'yearly' ? 'flat' : 'outlined'"
                size="large"
                block
                class="mt-4"
              >
                {{ selectedPlan === 'yearly' ? '✓ Selected' : 'Select Plan' }}
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <v-btn 
        color="primary" 
        size="x-large" 
        block 
        class="mb-4"
        :loading="paymentLoading"
        :disabled="!selectedPlan"
        @click="subscribe"
        style="max-width: 500px; margin: 0 auto;"
      >
        <v-icon left class="mr-2">mdi-credit-card</v-icon>
        Pay with M-Pesa / Card
      </v-btn>
      
      <p class="text-caption text-grey mb-4">
        <v-icon size="16" color="success">mdi-shield-check</v-icon>
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

// Currency conversion rates
const conversionRates = {
  'USD': 1,
  'KES': 140,
  'UGX': 3700,
  'TZS': 2500,
  'EUR': 0.92,
  'GBP': 0.79
}

// Currency symbols
const currencySymbols = {
  'USD': '$',
  'KES': 'KSh ',
  'UGX': 'USh ',
  'TZS': 'TSh ',
  'EUR': '€',
  'GBP': '£'
}

// Dynamic pricing based on business type and currency
const pricing = computed(() => {
  const isTourCompany = authStore.businessType === 'tour'
  const baseMonthly = isTourCompany ? 15 : 10  // USD
  const baseYearly = isTourCompany ? 150 : 100  // USD
  
  const currency = authStore.preferredCurrency || 'KES'
  const rate = conversionRates[currency] || conversionRates['KES']
  const symbol = currencySymbols[currency] || 'KSh '
  
  const monthlyAmount = Math.round(baseMonthly * rate)
  const yearlyAmount = Math.round(baseYearly * rate)
  
  return {
    monthly: `${symbol}${monthlyAmount.toLocaleString()}`,
    yearly: `${symbol}${yearlyAmount.toLocaleString()}`
  }
})

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

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.pricing-card {
  border: 2px solid transparent;
  min-height: 280px;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.selected-plan {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 0.2);
}

.best-value-chip {
  z-index: 1
.cursor-pointer:hover {
  transform: scale(1.02);
}
</style>
