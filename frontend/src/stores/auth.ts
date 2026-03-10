import type { Session, User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'

export type AppRole = 'user' | 'agent' | null

type AuthState = {
  session: Session | null
  user: User | null
  role: AppRole
  isLoading: boolean
  isRecoveryMode: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    session: null,
    user: null,
    role: null,
    isLoading: true,
    isRecoveryMode: false,
  }),

  actions: {
    setSession(session: Session | null) {
      this.session = session
      this.user = session?.user ?? null
    },
    setRole(role: AppRole) {
      this.role = role
    },
    setLoading(value: boolean) {
      this.isLoading = value
    },
    setRecoveryMode(value: boolean) {
      this.isRecoveryMode = value
    },
    clear() {
      this.session = null
      this.user = null
      this.role = null
      this.isLoading = false
      this.isRecoveryMode = false
    },
  },
})
