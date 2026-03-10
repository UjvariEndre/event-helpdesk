import { supabase } from '@/shared/lib/supabase'

export async function requestPasswordReset(email: string) {
  const redirectTo = `${import.meta.env.VITE_APP_URL}/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    throw error
  }
}
