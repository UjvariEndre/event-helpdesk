import { supabase } from '@/shared/lib/supabase'

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    throw error
  }
}
