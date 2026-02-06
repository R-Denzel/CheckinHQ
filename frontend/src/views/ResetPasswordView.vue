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
      <div class="text-center mb-8">
        <div class="mb-3">
          <v-icon size="64" :color="success ? 'success' : 'primary'">
            {{ success ? 'mdi-check-circle' : 'mdi-lock-reset' }}
          </v-icon>
        </div>
        <h1 class="text-h4 font-weight-bold" style="color: #111B21;">
          {{ success ? 'Password Reset!' : 'Reset Password' }}
        </h1>
        <p v-if="!success" class="text-subtitle-1" style="color: #667781;">Enter your new password</p>
      </div>

      <!-- Success State -->
      <div v-if="success" class="text-center">
        <p class="text-body-1 mb-4" style="color: #111B21;">
          Your password has been reset successfully!
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

      <!-- Password Form -->
      <v-form v-else @submit.prevent="handleSubmit" ref="form">
        <v-text-field
          v-model="password"
          label="New Password"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          :rules="[rules.required, rules.minLength]"
          required
          bg-color="#F0F2F5"
        />

        <v-text-field
          v-model="confirmPassword"
          label="Confirm Password"
          :type="showConfirmPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          :rules="[rules.required, rules.match]"
          required
          bg-color="#F0F2F5"
        />

        <!-- Error Message -->
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
          {{ error }}
        </v-alert>

        <!-- Submit Button -->
        <v-btn
          type="submit"
          color="primary"
          block
          size="x-large"
          :loading="loading"
          class="mb-4"
          style="text-transform: none; font-weight: 600;"
        >
          Reset Password
        </v-btn>

        <!-- Back to Login -->
        <div class="text-center">
          <p class="text-body-2" style="color: #667781;">
            <router-link to="/login" style="color: #128C7E; font-weight: 600; text-decoration: none;">
              Back to Sign In
            </router-link>
          </p>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref(null)
const success = ref(false)
const form = ref(null)
const token = ref('')

const rules = {
  required: value => !!value || 'Required',
  minLength: value => value.length >= 6 || 'Password must be at least 6 characters',
  match: value => value === password.value || 'Passwords do not match'
}

onMounted(() => {
  token.value = route.query.token
  if (!token.value) {
    error.value = 'Invalid or missing reset token'
  }
})

const handleSubmit = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  if (!token.value) {
    error.value = 'Invalid or missing reset token'
    return
  }

  loading.value = true
  error.value = null

  try {
    await api.auth.resetPassword(token.value, password.value)
    success.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to reset password. The link may have expired.'
  } finally {
    loading.value = false
  }
}
</script>
