import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Router Configuration
 * Simple, mobile-first navigation
 */
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/AdminLoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/subscriptions',
    name: 'SubscriptionManagement',
    component: () => import('@/views/SubscriptionManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/bookings',
    name: 'Bookings',
    component: () => import('@/views/BookingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bookings/new',
    name: 'NewBooking',
    component: () => import('@/views/NewBookingView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bookings/:id',
    name: 'BookingDetail',
    component: () => import('@/views/BookingDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bookings/:id/edit',
    name: 'EditBooking',
    component: () => import('@/views/EditBookingView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth
  const requiresAdmin = to.meta.requiresAdmin

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to appropriate login page
    next(requiresAdmin ? '/admin/login' : '/login')
  } else if (requiresAdmin && !authStore.isAdmin) {
    // Not an admin, redirect to regular dashboard
    next('/')
  } else if (!requiresAuth && authStore.isAuthenticated) {
    if (to.name === 'Login' || to.name === 'Register') {
      // Already logged in, redirect to appropriate dashboard
      next(authStore.isAdmin ? '/admin' : '/')
    } else if (to.name === 'AdminLogin' && !authStore.isAdmin) {
      // Regular user trying to access admin login
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
