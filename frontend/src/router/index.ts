import AgentPage from '@/features/agent/pages/AgentPage.vue'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage.vue'
import LoginPage from '@/features/auth/pages/LoginPage.vue'
import MfaChallengePage from '@/features/auth/pages/MfaChallengePage.vue'
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
      path: '/mfa',
      component: MfaChallengePage,
      meta: { requiresAuth: true },
    },
    // ! This MFA setup is not for every users, only for testing purposes
    // {
    //   path: '/mfa-setup',
    //   component: MfaSetupPage,
    //   meta: { requiresAuth: true },
    // },
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

// Guard to protect routes based on authentication and roles
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (authStore.isLoading) {
    return true
  }

  if (to.meta.requiresAuth && !authStore.user) {
    return '/login'
  }

  if (to.meta.guestOnly && authStore.user) {
    if (authStore.isMfaRequiredForSession && !authStore.isMfaVerifiedForSession) {
      return '/mfa'
    }

    return authStore.role === 'agent' ? '/agent' : '/events'
  }

  const isProtectedAppRoute = ['/events', '/helpdesk', '/agent'].includes(to.path)

  if (
    isProtectedAppRoute &&
    authStore.isMfaRequiredForSession &&
    !authStore.isMfaVerifiedForSession
  ) {
    return '/mfa'
  }

  const requiredRole = to.meta.role as 'user' | 'agent' | undefined

  if (requiredRole && authStore.role !== requiredRole) {
    return authStore.role === 'agent' ? '/agent' : '/events'
  }

  return true
})

export default router
