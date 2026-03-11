import { apiFetch } from '@/shared/lib/api-client'
import type {
  HelpdeskChatDetail,
  HelpdeskChatListItem,
  SendChatMessageInput,
  UpdateChatInput,
} from '@/shared/types/helpdesk'

export function getAgentChats() {
  return apiFetch<HelpdeskChatListItem[]>('/agent/chats')
}

export function getAgentChatById(chatId: string) {
  return apiFetch<HelpdeskChatDetail>(`/agent/chats/${chatId}`)
}

export function patchAgentChat(chatId: string, input: UpdateChatInput) {
  return apiFetch<HelpdeskChatDetail>(`/agent/chats/${chatId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function postAgentChatMessage(chatId: string, input: SendChatMessageInput) {
  return apiFetch<HelpdeskChatDetail>(`/agent/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content: input.content,
    }),
  })
}
