import type {
  ChatStatus,
  HelpdeskChatDetail,
  HelpdeskChatListItem,
  HelpdeskMessage,
  HelpdeskParticipant,
  SendChatMessageInput,
  UpdateChatInput,
} from '../../../shared/types/helpdesk'

const currentAgent: HelpdeskParticipant = {
  id: 'agent-1',
  name: 'Maya Patel',
  email: 'maya.patel@support.internal',
}

const backupAgent: HelpdeskParticipant = {
  id: 'agent-2',
  name: 'Jordan Kim',
  email: 'jordan.kim@support.internal',
}

const users = {
  alina: {
    id: 'user-1',
    name: 'Alina Rossi',
    email: 'alina.rossi@example.com',
  },
  marcus: {
    id: 'user-2',
    name: 'Marcus Lee',
    email: 'marcus.lee@example.com',
  },
  sofia: {
    id: 'user-3',
    name: 'Sofia Turner',
    email: 'sofia.turner@example.com',
  },
  noah: {
    id: 'user-4',
    name: 'Noah Chen',
    email: 'noah.chen@example.com',
  },
} satisfies Record<string, HelpdeskParticipant>

const mockChats: HelpdeskChatDetail[] = [
  {
    id: 'chat-1001',
    subject: 'Duplicate ticket confirmation for spring gala',
    status: 'open',
    user: users.alina,
    assignedAgent: currentAgent,
    lastMessagePreview: 'I still see two confirmation emails for the same booking.',
    updatedAt: '2026-03-11T09:24:00.000Z',
    messages: [
      {
        id: 'msg-10011',
        chatId: 'chat-1001',
        senderType: 'user',
        senderUserId: users.alina.id,
        senderLabel: users.alina.email,
        content: 'I submitted one request for the spring gala, but I got two confirmation emails.',
        createdAt: '2026-03-11T08:55:00.000Z',
      },
      {
        id: 'msg-10012',
        chatId: 'chat-1001',
        senderType: 'agent',
        senderUserId: currentAgent.id,
        senderLabel: currentAgent.name,
        content:
          'I am checking the booking records now. Can you confirm the event title on both emails?',
        createdAt: '2026-03-11T09:08:00.000Z',
      },
      {
        id: 'msg-10013',
        chatId: 'chat-1001',
        senderType: 'user',
        senderUserId: users.alina.id,
        senderLabel: users.alina.email,
        content: 'I still see two confirmation emails for the same booking.',
        createdAt: '2026-03-11T09:24:00.000Z',
      },
    ],
  },
  {
    id: 'chat-1002',
    subject: 'Need invoice for vendor reimbursement',
    status: 'pending',
    user: users.marcus,
    assignedAgent: backupAgent,
    lastMessagePreview: 'I have attached the payment reference. Is anything else needed?',
    updatedAt: '2026-03-11T07:42:00.000Z',
    messages: [
      {
        id: 'msg-10021',
        chatId: 'chat-1002',
        senderType: 'user',
        senderUserId: users.marcus.id,
        senderLabel: users.marcus.email,
        content: 'I need an invoice copy for my vendor reimbursement request.',
        createdAt: '2026-03-11T06:58:00.000Z',
      },
      {
        id: 'msg-10022',
        chatId: 'chat-1002',
        senderType: 'agent',
        senderUserId: backupAgent.id,
        senderLabel: backupAgent.name,
        content: 'Please send the payment reference so we can match it to the invoice.',
        createdAt: '2026-03-11T07:11:00.000Z',
      },
      {
        id: 'msg-10023',
        chatId: 'chat-1002',
        senderType: 'user',
        senderUserId: users.marcus.id,
        senderLabel: users.marcus.email,
        content: 'I have attached the payment reference. Is anything else needed?',
        createdAt: '2026-03-11T07:42:00.000Z',
      },
    ],
  },
  {
    id: 'chat-1003',
    subject: 'Change attendee email on my event registration',
    status: 'resolved',
    user: users.sofia,
    assignedAgent: currentAgent,
    lastMessagePreview:
      'The registration email is updated. You should receive future notices at the new address.',
    updatedAt: '2026-03-10T16:18:00.000Z',
    messages: [
      {
        id: 'msg-10031',
        chatId: 'chat-1003',
        senderType: 'user',
        senderUserId: users.sofia.id,
        senderLabel: users.sofia.email,
        content: 'Can you switch my registration to my work email instead of my personal one?',
        createdAt: '2026-03-10T15:27:00.000Z',
      },
      {
        id: 'msg-10032',
        chatId: 'chat-1003',
        senderType: 'agent',
        senderUserId: currentAgent.id,
        senderLabel: currentAgent.name,
        content:
          'The registration email is updated. You should receive future notices at the new address.',
        createdAt: '2026-03-10T16:18:00.000Z',
      },
    ],
  },
  {
    id: 'chat-1004',
    subject: 'Question about event schedule timezone',
    status: 'open',
    user: users.noah,
    assignedAgent: null,
    lastMessagePreview: 'The agenda still shows the wrong timezone after refreshing.',
    updatedAt: '2026-03-11T10:02:00.000Z',
    messages: [
      {
        id: 'msg-10041',
        chatId: 'chat-1004',
        senderType: 'user',
        senderUserId: users.noah.id,
        senderLabel: users.noah.email,
        content: 'My agenda says the keynote starts at 09:00, but I think that is in UTC.',
        createdAt: '2026-03-11T09:37:00.000Z',
      },
      {
        id: 'msg-10042',
        chatId: 'chat-1004',
        senderType: 'user',
        senderUserId: users.noah.id,
        senderLabel: users.noah.email,
        content: 'The agenda still shows the wrong timezone after refreshing.',
        createdAt: '2026-03-11T10:02:00.000Z',
      },
    ],
  },
]

function cloneChat<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function sleep(ms = 150) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function toListItem(chat: HelpdeskChatDetail): HelpdeskChatListItem {
  return {
    id: chat.id,
    subject: chat.subject,
    status: chat.status,
    user: chat.user,
    assignedAgent: chat.assignedAgent,
    lastMessagePreview: chat.lastMessagePreview,
    updatedAt: chat.updatedAt,
  }
}

function getChatByIdOrThrow(chatId: string) {
  const chat = mockChats.find((entry) => entry.id === chatId)

  if (!chat) {
    throw new Error('Chat not found')
  }

  return chat
}

export async function getAgentChats(): Promise<HelpdeskChatListItem[]> {
  await sleep()

  return cloneChat(mockChats)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .map(toListItem)
}

export async function getAgentChatById(chatId: string): Promise<HelpdeskChatDetail> {
  await sleep()

  return cloneChat(getChatByIdOrThrow(chatId))
}

export async function postAgentChatMessage(
  chatId: string,
  input: SendChatMessageInput,
): Promise<HelpdeskChatDetail> {
  await sleep()

  const chat = getChatByIdOrThrow(chatId)
  const trimmedContent = input.content.trim()

  if (!trimmedContent) {
    throw new Error('Message content is required')
  }

  const createdAt = new Date().toISOString()
  const message: HelpdeskMessage = {
    id: `msg-${Date.now()}`,
    chatId,
    senderType: 'agent',
    senderUserId: currentAgent.id,
    senderLabel: currentAgent.name,
    content: trimmedContent,
    createdAt,
  }

  chat.messages.push(message)
  chat.lastMessagePreview = trimmedContent
  chat.updatedAt = createdAt

  if (!chat.assignedAgent) {
    chat.assignedAgent = currentAgent
  }

  return cloneChat(chat)
}

export async function patchAgentChat(
  chatId: string,
  input: UpdateChatInput,
): Promise<HelpdeskChatDetail> {
  await sleep()

  const chat = getChatByIdOrThrow(chatId)
  const nextStatus: ChatStatus = input.status

  chat.status = nextStatus
  chat.updatedAt = new Date().toISOString()

  if (!chat.assignedAgent) {
    chat.assignedAgent = currentAgent
  }

  return cloneChat(chat)
}
