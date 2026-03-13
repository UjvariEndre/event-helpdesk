import { createClient, type Session } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export async function syncRealtimeAuth(session?: Session | null) {
  const currentSession = session ?? (await supabase.auth.getSession()).data.session

  const accessToken = currentSession?.access_token

  if (!accessToken) {
    return
  }

  await supabase.realtime.setAuth(accessToken)
}
