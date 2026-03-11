import { apiFetch } from '@/shared/lib/api-client'
import type { EventItem } from '../types/event'

export type CreateEventPayload = {
  title: string
  description?: string
  occurrence: string
}

export function createEvent(payload: CreateEventPayload) {
  return apiFetch<EventItem>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
