export type ChatStatus = 'open' | 'pending' | 'resolved'

export type SenderType = 'user' | 'agent' | 'assistant'

export interface HelpdeskParticipant {
  id: string
  email: string
  name?: string
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

export type SpeechRecognitionResultAlternativeLike = {
  transcript: string
}

export type SpeechRecognitionResultLike = {
  0: SpeechRecognitionResultAlternativeLike
  length: number
  isFinal?: boolean
}

export type SpeechRecognitionResultListLike = {
  0: SpeechRecognitionResultLike
  length: number
}

export type SpeechRecognitionEventLike = Event & {
  results: SpeechRecognitionResultListLike
}

export type SpeechRecognitionLike = EventTarget & {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: ((this: EventTarget, ev: Event) => void) | null
  onend: ((this: EventTarget, ev: Event) => void) | null
  onerror: ((this: EventTarget, ev: Event) => void) | null
  onresult: ((this: EventTarget, ev: SpeechRecognitionEventLike) => void | Promise<void>) | null
  start: () => void
  stop: () => void
}

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor
    SpeechRecognition?: SpeechRecognitionCtor
  }
}
