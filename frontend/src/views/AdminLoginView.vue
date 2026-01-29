<template>
  <v-container fluid class="fill-height" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-h5 font-weight-bold text-center pa-6 bg-grey-lighten-4">
            <v-icon size="40" color="primary" class="mr-2">mdi-shield-account</v-icon>
            Admin Login
          </v-card-title>

          <v-card-text class="pa-6">
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="error = null"
            >
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Admin Email"
                prepend-inner-icon="mdi-email"
                type="email"
                required
                variant="outlined"
                class="mb-2"
              />

              <v-text-field
                v-model="password"
                label="Password"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showPassword ? 'text' : 'password'"
                @click:append-inner="showPassword = !showPassword"
                required
                variant="outlined"
                class="mb-4"
              />

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                class="mb-3"
              >
                Login as Admin
              </v-btn>

              <div class="text-center">
                <v-btn
                  variant="text"
                  color="grey-darken-1"
                  size="small"
                  @click="$router.push('/login')"
                >
                  Back to Regular Login
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
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

const handleLogin = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await authStore.login({
      email: email.value,
      password: password.value
    })

    // Check if user is actually an admin
    if (!response.user.isAdmin) {
      error.value = 'Access denied. This account does not have admin privileges.'
      await authStore.logout()
      return
    }

    // Redirect to admin dashboard
    router.push('/admin')
  } catch (err) {
    error.value = err.response?.data?.error || 'Invalid admin credentials'
  } finally {
    loading.value = false
  }
}
</script>
