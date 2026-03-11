import { apiFetch } from '@/shared/lib/api-client'
import type { EventItem } from '../types/event'

export type UpdateEventPayload = {
  id: string
  description?: string
}

export function updateEvent(payload: UpdateEventPayload) {
  return apiFetch<EventItem>(`/events/${payload.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      description: payload.description,
    }),
  })
}
