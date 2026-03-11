import { apiFetch } from '@/shared/lib/api-client'
import type { HelpdeskChatDetail, SendChatMessageInput } from '@/shared/types/helpdesk'

export function getHelpdeskChat() {
  return apiFetch<HelpdeskChatDetail | null>('/helpdesk/chat')
}

export function postHelpdeskChatMessage(input: SendChatMessageInput) {
  return apiFetch<HelpdeskChatDetail>('/helpdesk/chat/messages', {
    method: 'POST',
    body: JSON.stringify({
      content: input.content,
    }),
  })
}
