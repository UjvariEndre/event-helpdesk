import { supabase } from '@/shared/lib/supabase'

export async function verifyMfaCode(code: string) {
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()

  if (factorsError) {
    throw factorsError
  }

  const factor = factors.totp[0]

  if (!factor) {
    throw new Error('No enrolled TOTP factor found')
  }

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code,
  })

  if (error) {
    throw error
  }

  return data
}
