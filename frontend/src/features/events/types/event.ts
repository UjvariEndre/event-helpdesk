export type EventItem = {
  id: string
  user_id: string
  title: string
  description: string | null
  occurrence: string
  created_at?: string
  updated_at?: string | null
}
