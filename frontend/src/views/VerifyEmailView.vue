<template>
  <div style="background: linear-gradient(135deg, #128C7E 0%, #25D366 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px;">
    <v-card
      class="pa-6"
      elevation="8"
      max-width="420"
      width="100%"
      style="border-radius: 16px;"
    >
      <!-- Logo/Header -->
      <div class="text-center mb-6">
        <div class="mb-3">
          <v-icon :size="64" :color="success ? 'success' : error ? 'error' : 'primary'">
            {{ success ? 'mdi-check-circle' : error ? 'mdi-alert-circle' : 'mdi-email-check' }}
          </v-icon>
        </div>
        <h1 class="text-h5 font-weight-bold" style="color: #111B21;">
          {{ success ? 'Email Verified!' : error ? 'Verification Failed' : 'Verifying Email...' }}
        </h1>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-body-2 mt-4" style="color: #667781;">Please wait...</p>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="text-center">
        <p class="text-body-1 mb-4" style="color: #111B21;">
          Your email has been verified successfully!
        </p>
        <v-btn
          color="primary"
          block
          size="large"
          @click="$router.push('/login')"
          style="text-transform: none; font-weight: 600;"
        >
          Go to Login
        </v-btn>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <v-alert type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>
        <v-btn
          color="primary"
          block
          size="large"
          @click="$router.push('/register')"
          style="text-transform: none; font-weight: 600;"
        >
          Back to Register
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const loading = ref(true)
const success = ref(false)
const error = ref(null)

onMounted(async () => {
  const token = route.query.token
  
  if (!token) {
    error.value = 'Verification token is missing'
    loading.value = false
    return
  }

  try {
    await api.auth.verifyEmail(token)
    success.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Verification failed. The link may have expired.'
  } finally {
    loading.value = false
  }
})
</script>
