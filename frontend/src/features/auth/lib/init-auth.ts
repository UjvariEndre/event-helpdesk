import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Pinia } from 'pinia'
import { getProfileRole } from '../api/get-profile-role'

export async function initAuth(pinia: Pinia) {
  const authStore = useAuthStore(pinia)

  authStore.setLoading(true)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  authStore.setSession(session)

  if (session?.user) {
    try {
      const role = await getProfileRole(session.user.id)
      authStore.setRole(role)
    } catch {
      authStore.setRole(null)
    }
  } else {
    authStore.setRole(null)
  }

  authStore.setLoading(false)

  supabase.auth.onAuthStateChange(async (_event, session) => {
    authStore.setLoading(true)
    authStore.setSession(session)

    if (session?.user) {
      try {
        const role = await getProfileRole(session.user.id)
        authStore.setRole(role)
      } catch {
        authStore.setRole(null)
      }
    } else {
      authStore.setRole(null)
    }

    authStore.setLoading(false)
  })
}
