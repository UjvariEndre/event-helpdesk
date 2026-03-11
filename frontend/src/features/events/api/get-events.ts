import { apiFetch } from '@/shared/lib/api-client'
import type { EventItem } from '../types/event'

export function getEvents() {
  return apiFetch<EventItem[]>('/events')
}
