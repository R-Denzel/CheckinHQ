<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>

    <!-- Bottom Navigation (mobile-first) -->
    <v-bottom-navigation
      v-if="isAuthenticated"
      v-model="activeTab"
      grow
      color="primary"
      height="70"
    >
      <v-btn value="dashboard" to="/">
        <v-icon>mdi-view-dashboard</v-icon>
        <span>Today</span>
      </v-btn>

      <v-btn value="bookings" to="/bookings">
        <v-icon>mdi-calendar-multiple</v-icon>
        <span>Bookings</span>
      </v-btn>

      <v-btn value="new" to="/bookings/new" color="secondary">
        <v-icon size="large">mdi-plus-circle</v-icon>
        <span>Add</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref('dashboard')
const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<style>
/* Global styles */
body {
  font-family: 'Inter', sans-serif;
}

/* Mobile-optimized */
@media (max-width: 600px) {
  .v-container {
    padding: 12px !important;
  }
}
</style>
