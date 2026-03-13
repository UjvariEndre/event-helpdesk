import router from '@/router'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Pinia } from 'pinia'
import { getMfaAal } from '../api/get-mfa-aal'
import { getProfileAuthData } from '../api/get-profile-auth-data'

async function refreshAuthState(pinia: Pinia) {
  const authStore = useAuthStore(pinia)

  authStore.setLoading(true)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    authStore.setSession(session)

    if (!session?.user) {
      authStore.setRole(null)
      authStore.setMfaState({
        required: false,
        verified: false,
      })
      return
    }

    const profile = await getProfileAuthData(session.user.id)
    authStore.setRole(profile.role)

    if (profile.mfaRequired) {
      const aal = await getMfaAal()

      authStore.setMfaState({
        required: true,
        verified: aal.currentLevel === 'aal2',
      })

      if (aal.currentLevel !== 'aal2' && aal.nextLevel === 'aal2') {
        await router.push('/mfa')
        return
      }
    } else {
      authStore.setMfaState({
        required: false,
        verified: true,
      })
    }
  } catch {
    authStore.setSession(null)
    authStore.setRole(null)
    authStore.setMfaState({
      required: false,
      verified: false,
    })
  } finally {
    authStore.setLoading(false)
  }
}

export async function initAuth(pinia: Pinia) {
  await refreshAuthState(pinia)

  const authStore = useAuthStore(pinia)

  supabase.auth.onAuthStateChange((event, session) => {
    authStore.setSession(session)

    if (event === 'PASSWORD_RECOVERY') {
      authStore.setRecoveryMode(true)
    }

    setTimeout(() => {
      void refreshAuthState(pinia)
    }, 0)
  })
}
