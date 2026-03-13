import { supabase } from '@/shared/lib/supabase'

export type MfaAalData = {
  currentLevel: string | null
  nextLevel: string | null
  currentAuthenticationMethods: unknown[]
}

export async function getMfaAal(): Promise<MfaAalData> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (error) {
    throw error
  }

  return {
    currentLevel: data.currentLevel ?? null,
    nextLevel: data.nextLevel ?? null,
    currentAuthenticationMethods: data.currentAuthenticationMethods ?? [],
  }
}
