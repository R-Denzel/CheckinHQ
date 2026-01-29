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
          <v-icon size="64" color="primary">mdi-message-text</v-icon>
        </div>
        <h1 class="text-h4 font-weight-bold" style="color: #111B21;">CheckinHQ</h1>
        <p class="text-subtitle-1" style="color: #667781;">Create your account</p>
      </div>

      <!-- Register Form -->
      <v-form @submit.prevent="handleRegister" ref="form">
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
          v-model="businessName"
          label="Business Name (Optional)"
          prepend-inner-icon="mdi-store-outline"
          hint="e.g., Safari Tours Uganda"
          bg-color="#F0F2F5"
        />

        <v-select
          v-model="businessType"
          label="Business Type"
          :items="businessTypeOptions"
          prepend-inner-icon="mdi-briefcase-outline"
          hint="This helps us customize labels for you"
          persistent-hint
          bg-color="#F0F2F5"
        />

        <v-select
          v-model="preferredCurrency"
          label="Preferred Currency"
          :items="currencyOptions"
          prepend-inner-icon="mdi-currency-usd"
          hint="Default currency for bookings"
          persistent-hint
          bg-color="#F0F2F5"
        />

        <v-text-field
          v-model="password"
          label="Password"
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
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-check-outline"
          :rules="[rules.required, rules.passwordMatch]"
          required
          bg-color="#F0F2F5"
        />

        <!-- Error Message -->
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
          {{ error }}
        </v-alert>

        <!-- Register Button -->
        <v-btn
          type="submit"
          color="primary"
          block
          size="x-large"
          :loading="loading"
          class="mb-4"
          style="text-transform: none; font-weight: 600;"
        >
          Create Account
        </v-btn>

        <!-- Login Link -->
        <div class="text-center">
          <p class="text-body-2" style="color: #667781;">
            Already have an account?
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const businessName = ref('')
const businessType = ref('airbnb')
const preferredCurrency = ref('USD')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref(null)
const form = ref(null)

const businessTypeOptions = [
  { title: 'Airbnb Host / Property Rental', value: 'airbnb' },
  { title: 'Tour Company / Travel Agency', value: 'tour' }
]

const currencyOptions = [
  { title: 'USD - US Dollar ($)', value: 'USD' },
  { title: 'UGX - Ugandan Shilling (USh)', value: 'UGX' },
  { title: 'KES - Kenyan Shilling (KSh)', value: 'KES' },
  { title: 'TZS - Tanzanian Shilling (TSh)', value: 'TZS' },
  { title: 'EUR - Euro (€)', value: 'EUR' },
  { title: 'GBP - British Pound (£)', value: 'GBP' }
]

const rules = {
  required: value => !!value || 'Required',
  email: value => /.+@.+\..+/.test(value) || 'Invalid email',
  minLength: value => value.length >= 6 || 'Minimum 6 characters',
  passwordMatch: value => value === password.value || 'Passwords must match'
}

const handleRegister = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  error.value = null

  try {
    await authStore.register(email.value, password.value, businessName.value, businessType.value, preferredCurrency.value)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
