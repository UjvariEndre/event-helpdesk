import AgentPage from '@/features/agent/pages/AgentPage.vue'
import LoginPage from '@/features/auth/pages/LoginPage.vue'
import EventsPage from '@/features/events/pages/EventsPage.vue'
import HelpdeskPage from '@/features/helpdesk/pages/HelpdeskPage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/events', component: EventsPage },
    { path: '/helpdesk', component: HelpdeskPage },
    { path: '/agent', component: AgentPage },
  ],
})

export default router