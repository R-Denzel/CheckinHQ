<template>
  <v-app style="background-color: #F0F2F5;">
    <v-main>
      <router-view />
    </v-main>

    <!-- Bottom Navigation (mobile-first, WhatsApp-inspired) -->
    <!-- Admin Navigation -->
    <v-bottom-navigation
      v-if="isAuthenticated && isAdmin"
      v-model="activeTab"
      grow
      bg-color="surface"
      height="64"
      elevation="3"
      style="border-top: 1px solid #E9EDEF;"
    >
      <v-btn value="admin" to="/admin">
        <v-icon>mdi-shield-crown</v-icon>
        <span class="text-caption">Dashboard</span>
      </v-btn>

      <v-btn @click="authStore.logout">
        <v-icon>mdi-logout</v-icon>
        <span class="text-caption">Logout</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Host Navigation -->
    <v-bottom-navigation
      v-else-if="isAuthenticated && !isAdmin"
      v-model="activeTab"
      grow
      bg-color="surface"
      height="64"
      elevation="3"
      style="border-top: 1px solid #E9EDEF;"
    >
      <v-btn value="dashboard" to="/">
        <v-icon>mdi-message-text</v-icon>
        <span class="text-caption">Today</span>
      </v-btn>

      <v-btn value="bookings" to="/bookings">
        <v-icon>mdi-calendar-check</v-icon>
        <span class="text-caption">All</span>
      </v-btn>

      <v-btn value="new" to="/bookings/new">
        <v-icon size="28" color="primary">mdi-plus-circle</v-icon>
        <span class="text-caption">Add</span>
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
const isAdmin = computed(() => authStore.isAdmin)
</script>

<style>
/* Global styles - WhatsApp-inspired */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  background-color: #F0F2F5;
}

/* WhatsApp-inspired gradient header */
.whatsapp-header {
  background: linear-gradient(135deg, #128C7E 0%, #25D366 100%);
  color: white;
}

/* Chat-like card */
.chat-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.chat-card:active {
  background: #F5F6F6;
  transform: scale(0.98);
}

/* Soft green accent */
.green-accent {
  background: linear-gradient(135deg, #DCF8C6 0%, #D1F4CC 100%);
}

/* Mobile-optimized */
@media (max-width: 600px) {
  .v-container {
    padding: 8px !important;
  }
}

/* Remove harsh shadows */
.v-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
}

/* WhatsApp-style section header */
.section-header {
  background: #F0F2F5;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #667781;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
