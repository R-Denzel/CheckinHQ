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
      
      <v-card variant="outlined" class="pa-4 mb-3" color="primary">
        <div class="d-flex justify-space-between align-center">
          <div class="text-left">
            <div class="text-h6 font-weight-bold">$10/month</div>
            <div class="text-caption">Unlimited bookings</div>
          </div>
          <v-btn color="primary" size="large" @click="subscribe">
            Subscribe Now
          </v-btn>
        </div>
      </v-card>
      
      <p class="text-caption text-grey mb-4">
        Simple, affordable booking management for your business
      </p>
      
      <v-btn variant="text" @click="logout" color="grey">
        Logout
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const subscribe = () => {
  // TODO: Integrate with Stripe or mobile money
  alert('Payment integration coming soon! Contact support to activate your subscription.')
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
