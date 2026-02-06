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
          <v-icon size="64" color="primary">mdi-lock-reset</v-icon>
        </div>
        <h1 class="text-h4 font-weight-bold" style="color: #111B21;">Forgot Password?</h1>
        <p class="text-subtitle-1" style="color: #667781;">
          {{ emailSent ? 'Check your email' : 'Enter your email to reset it' }}
        </p>
      </div>

      <!-- Email Sent Confirmation -->
      <div v-if="emailSent" class="text-center">
        <v-alert type="success" variant="tonal" class="mb-4">
          Password reset link sent! Check your email inbox.
        </v-alert>
        <p class="text-body-2 mb-4" style="color: #667781;">
          We've sent a password reset link to <strong>{{ email }}</strong>
        </p>
        <v-btn
          color="primary"
          variant="text"
          @click="emailSent = false; email = ''"
        >
          Try another email
        </v-btn>
      </div>

      <!-- Email Form -->
      <v-form v-else @submit.prevent="handleSubmit" ref="form">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          prepend-inner-icon="mdi-email-outline"
          :rules="[rules.required, rules.email]"
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
          Send Reset Link
        </v-btn>

        <!-- Back to Login -->
        <div class="text-center">
          <p class="text-body-2" style="color: #667781;">
            Remember your password?
            <router-link to="/login" style="color: #128C7E; font-weight: 600; text-decoration: none;">
              Sign In
            </router-link>
          </p>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'

const email = ref('')
const loading = ref(false)
const error = ref(null)
const emailSent = ref(false)
const form = ref(null)

const rules = {
  required: value => !!value || 'Required',
  email: value => /.+@.+\..+/.test(value) || 'Invalid email'
}

const handleSubmit = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  error.value = null

  try {
    await api.auth.forgotPassword(email.value)
    emailSent.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to send reset email. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
