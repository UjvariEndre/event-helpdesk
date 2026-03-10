import { supabase } from '@/shared/lib/supabase'

export async function getProfileRole(userId: string): Promise<'user' | 'agent' | null> {
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single()

  if (error) {
    throw error
  }

  return (data?.role as 'user' | 'agent' | null) ?? null
}
