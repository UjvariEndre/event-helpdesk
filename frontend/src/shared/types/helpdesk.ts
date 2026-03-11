export type ChatStatus = 'open' | 'pending' | 'resolved'

export type SenderType = 'user' | 'agent' | 'assistant'

export interface HelpdeskParticipant {
  id: string
  name: string
  email: string
}

export interface HelpdeskMessage {
  id: string
  chatId: string
  senderType: SenderType
  senderUserId: string | null
  senderLabel: string
  content: string
  createdAt: string
}

export interface HelpdeskChatListItem {
  id: string
  subject: string
  status: ChatStatus
  user: HelpdeskParticipant
  assignedAgent: HelpdeskParticipant | null
  lastMessagePreview: string
  updatedAt: string
}

export interface HelpdeskChatDetail extends HelpdeskChatListItem {
  messages: HelpdeskMessage[]
}

export interface SendChatMessageInput {
  content: string
}

export interface UpdateChatInput {
  status: ChatStatus
}
