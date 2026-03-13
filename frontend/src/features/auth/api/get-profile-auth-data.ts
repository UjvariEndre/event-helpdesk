import { supabase } from '@/shared/lib/supabase'

export type ProfileAuthData = {
  role: 'user' | 'agent' | null
  mfaRequired: boolean
}

export async function getProfileAuthData(userId: string): Promise<ProfileAuthData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, mfa_required')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return {
    role: (data?.role as 'user' | 'agent' | null) ?? null,
    mfaRequired: Boolean(data?.mfa_required),
  }
}
