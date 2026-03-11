import { apiFetch } from '@/shared/lib/api-client'

export function deleteEvent(id: string) {
  return apiFetch<void>(`/events/${id}`, {
    method: 'DELETE',
  })
}
