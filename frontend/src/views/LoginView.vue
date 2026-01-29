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
          <v-icon size="64" color="primary">mdi-message-text</v-icon>
        </div>
        <h1 class="text-h4 font-weight-bold" style="color: #111B21;">CheckinHQ</h1>
        <p class="text-subtitle-1" style="color: #667781;">Simple booking management</p>
      </div>

      <!-- Login Form -->
      <v-form @submit.prevent="handleLogin" ref="form">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          prepend-inner-icon="mdi-email-outline"
          :rules="[rules.required, rules.email]"
          required
          bg-color="#F0F2F5"
        />

        <v-text-field
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          :rules="[rules.required]"
          required
          bg-color="#F0F2F5"
        />

        <!-- Error Message -->
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
          {{ error }}
        </v-alert>

        <!-- Login Button -->
        <v-btn
          type="submit"
          color="primary"
          block
          size="x-large"
          :loading="loading"
          class="mb-4"
          style="text-transform: none; font-weight: 600;"
        >
          Sign In
        </v-btn>

        <!-- Register Link -->
        <div class="text-center">
          <p class="text-body-2" style="color: #667781;">
            Don't have an account?
            <router-link to="/register" style="color: #128C7E; font-weight: 600; text-decoration: none;">
              Sign Up
            </router-link>
          </p>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref(null)
const form = ref(null)

const rules = {
  required: value => !!value || 'Required',
  email: value => /.+@.+\..+/.test(value) || 'Invalid email'
}

const handleLogin = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  error.value = null

  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
