import { supabase } from '@/shared/lib/supabase'

export async function getFirstTotpFactorId(): Promise<string> {
  const { data, error } = await supabase.auth.mfa.listFactors()

  if (error) {
    throw error
  }

  const factor = data.totp[0]

  if (!factor) {
    throw new Error('No TOTP factor found for this user')
  }

  return factor.id
}
