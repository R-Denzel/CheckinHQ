<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-4" elevation="4">
          <!-- Logo/Header -->
          <div class="text-center mb-6">
            <h1 class="text-h4 font-weight-bold primary--text">CheckinHQ</h1>
            <p class="text-subtitle-1 text-grey">Simple booking management</p>
          </div>

          <!-- Login Form -->
          <v-form @submit.prevent="handleLogin" ref="form">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              prepend-inner-icon="mdi-email"
              :rules="[rules.required, rules.email]"
              required
            />

            <v-text-field
              v-model="password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :rules="[rules.required]"
              required
            />

            <!-- Error Message -->
            <v-alert v-if="error" type="error" class="mb-4" density="compact">
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
            >
              Sign In
            </v-btn>

            <!-- Register Link -->
            <div class="text-center">
              <p class="text-body-2">
                Don't have an account?
                <router-link to="/register" class="text-primary font-weight-bold">
                  Sign Up
                </router-link>
              </p>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
