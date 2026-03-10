import AgentPage from '@/features/agent/pages/AgentPage.vue'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage.vue'
import LoginPage from '@/features/auth/pages/LoginPage.vue'
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage.vue'
import EventsPage from '@/features/events/pages/EventsPage.vue'
import HelpdeskPage from '@/features/helpdesk/pages/HelpdeskPage.vue'
import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: '/events',
      component: EventsPage,
      meta: { requiresAuth: true, role: 'user' },
    },
    {
      path: '/helpdesk',
      component: HelpdeskPage,
      meta: { requiresAuth: true, role: 'user' },
    },
    {
      path: '/agent',
      component: AgentPage,
      meta: { requiresAuth: true, role: 'agent' },
    },
    {
      path: '/forgot-password',
      component: ForgotPasswordPage,
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      component: ResetPasswordPage,
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (authStore.isLoading) {
    return false
  }

  if (to.meta.requiresAuth && !authStore.user) {
    return '/login'
  }

  if (to.meta.guestOnly && authStore.user) {
    return authStore.role === 'agent' ? '/agent' : '/events'
  }

  const requiredRole = to.meta.role as 'user' | 'agent' | undefined

  if (requiredRole && authStore.role !== requiredRole) {
    return authStore.role === 'agent' ? '/agent' : '/events'
  }

  return true
})

export default router
