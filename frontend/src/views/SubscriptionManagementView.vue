<template>
  <div style="background-color: #F0F2F5; min-height: 100vh;">
    <!-- Header -->
    <div class="whatsapp-header" style="padding: 20px 16px 16px 16px;">
      <h1 class="text-h5 font-weight-bold mb-0">Subscription Management</h1>
      <p class="text-caption text-grey">Manage user subscriptions and trials</p>
    </div>

    <v-container class="py-4">
      <!-- Stats Cards -->
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-card>
            <v-card-text>
              <div class="text-caption text-grey">Active Subscriptions</div>
              <div class="text-h4 font-weight-bold text-success">{{ stats.active }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card>
            <v-card-text>
              <div class="text-caption text-grey">Active Trials</div>
              <div class="text-h4 font-weight-bold text-primary">{{ stats.trial }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card>
            <v-card-text>
              <div class="text-caption text-grey">Expired</div>
              <div class="text-h4 font-weight-bold text-error">{{ stats.expired }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Users Table -->
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>All Users</span>
          <v-btn icon variant="text" @click="loadUsers">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-progress-linear v-if="loading" indeterminate color="primary" />

        <v-table v-else>
          <thead>
            <tr>
              <th>Email</th>
              <th>Business</th>
              <th>Status</th>
              <th>Trial Expires</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>{{ user.business_name }}</td>
              <td>
                <v-chip 
                  size="small"
                  :color="getStatusColor(user.subscription_status)"
                >
                  {{ user.subscription_status }}
                </v-chip>
                <v-chip 
                  v-if="user.trial_expired"
                  size="small"
                  color="error"
                  variant="outlined"
                  class="ml-1"
                >
                  Trial Expired
                </v-chip>
              </td>
              <td>{{ formatDate(user.trial_expires_at) }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <v-btn
                  v-if="user.subscription_status !== 'active'"
                  size="small"
                  color="success"
                  variant="tonal"
                  @click="activateSubscription(user.id)"
                  :loading="actionLoading === user.id"
                >
                  Activate
                </v-btn>
                <v-btn
                  v-else
                  size="small"
                  color="error"
                  variant="tonal"
                  @click="deactivateSubscription(user.id)"
                  :loading="actionLoading === user.id"
                >
                  Deactivate
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-card-text v-if="!loading && users.length === 0" class="text-center text-grey">
          No users found
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const users = ref([])
const loading = ref(false)
const actionLoading = ref(null)
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

const stats = computed(() => {
  return {
    active: users.value.filter(u => u.subscription_status === 'active').length,
    trial: users.value.filter(u => u.subscription_status === 'trial').length,
    expired: users.value.filter(u => u.subscription_status === 'expired').length
  }
})

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await api.subscription.getUsers()
    users.value = response.data.users
  } catch (error) {
    showSnackbar('Failed to load users', 'error')
  } finally {
    loading.value = false
  }
}

const activateSubscription = async (userId) => {
  actionLoading.value = userId
  try {
    await api.subscription.activate(userId)
    showSnackbar('Subscription activated successfully', 'success')
    await loadUsers()
  } catch (error) {
    showSnackbar('Failed to activate subscription', 'error')
  } finally {
    actionLoading.value = null
  }
}

const deactivateSubscription = async (userId) => {
  actionLoading.value = userId
  try {
    await api.subscription.deactivate(userId)
    showSnackbar('Subscription deactivated', 'warning')
    await loadUsers()
  } catch (error) {
    showSnackbar('Failed to deactivate subscription', 'error')
  } finally {
    actionLoading.value = null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'trial': return 'primary'
    case 'expired': return 'error'
    default: return 'grey'
  }
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.whatsapp-header {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: white;
}
</style>
