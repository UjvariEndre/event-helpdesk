import {
  getAgentChatById,
  getAgentChats,
  patchAgentChat,
  postAgentChatMessage,
} from '@/features/agent/api/mock-helpdesk'
import type { ChatStatus, HelpdeskChatDetail, HelpdeskChatListItem } from '@/shared/types/helpdesk'
import { computed, ref } from 'vue'

export function useHelpdeskConversations() {
  const chats = ref<HelpdeskChatListItem[]>([])
  const selectedChat = ref<HelpdeskChatDetail | null>(null)
  const selectedChatId = ref<string | null>(null)
  const searchTerm = ref('')
  const statusFilter = ref<ChatStatus | 'all'>('all')
  const draftMessage = ref('')
  const isLoadingList = ref(false)
  const isLoadingDetail = ref(false)
  const isSending = ref(false)
  const isUpdatingStatus = ref(false)

  const statusOptions = [
    { label: 'All statuses', value: 'all' as const },
    { label: 'Open', value: 'open' as const },
    { label: 'Pending', value: 'pending' as const },
    { label: 'Resolved', value: 'resolved' as const },
  ]

  const ticketStatusOptions = statusOptions.filter((option) => option.value !== 'all')

  const filteredChats = computed(() => {
    const query = searchTerm.value.trim().toLowerCase()

    return chats.value.filter((chat) => {
      const matchesStatus = statusFilter.value === 'all' || chat.status === statusFilter.value
      const matchesSearch =
        !query ||
        chat.subject.toLowerCase().includes(query) ||
        chat.user.email.toLowerCase().includes(query) ||
        chat.lastMessagePreview.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  })

  async function loadChats() {
    isLoadingList.value = true

    try {
      const result = await getAgentChats()
      chats.value = result

      const nextSelectedId =
        selectedChatId.value && result.some((chat) => chat.id === selectedChatId.value)
          ? selectedChatId.value
          : (result[0]?.id ?? null)

      selectedChatId.value = nextSelectedId

      if (nextSelectedId) {
        await loadChatDetail(nextSelectedId)
      } else {
        selectedChat.value = null
      }
    } finally {
      isLoadingList.value = false
    }
  }

  async function loadChatDetail(chatId: string) {
    selectedChatId.value = chatId
    isLoadingDetail.value = true

    try {
      selectedChat.value = await getAgentChatById(chatId)
    } finally {
      isLoadingDetail.value = false
    }
  }

  function upsertChatListItem(chat: HelpdeskChatDetail) {
    const nextItem: HelpdeskChatListItem = {
      id: chat.id,
      subject: chat.subject,
      status: chat.status,
      user: chat.user,
      assignedAgent: chat.assignedAgent,
      lastMessagePreview: chat.lastMessagePreview,
      updatedAt: chat.updatedAt,
    }

    const remainingChats = chats.value.filter((entry) => entry.id !== chat.id)
    chats.value = [nextItem, ...remainingChats].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )
  }

  async function handleSelectChat(chatId: string) {
    if (selectedChatId.value === chatId && selectedChat.value) {
      return
    }

    draftMessage.value = ''
    await loadChatDetail(chatId)
  }

  async function handleSendMessage() {
    if (!selectedChatId.value || !draftMessage.value.trim()) {
      return
    }

    isSending.value = true

    try {
      const updatedChat = await postAgentChatMessage(selectedChatId.value, {
        content: draftMessage.value,
      })

      selectedChat.value = updatedChat
      upsertChatListItem(updatedChat)
      draftMessage.value = ''
    } finally {
      isSending.value = false
    }
  }

  async function handleStatusChange(status: ChatStatus) {
    if (!selectedChatId.value || !selectedChat.value || selectedChat.value.status === status) {
      return
    }

    isUpdatingStatus.value = true

    try {
      const updatedChat = await patchAgentChat(selectedChatId.value, { status })
      selectedChat.value = updatedChat
      upsertChatListItem(updatedChat)
    } finally {
      isUpdatingStatus.value = false
    }
  }

  function formatTime(value: string) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value))
  }

  function statusSeverity(status: ChatStatus) {
    if (status === 'resolved') return 'success' as const
    if (status === 'pending') return 'warn' as const
    return 'info' as const
  }

  return {
    chats,
    selectedChat,
    selectedChatId,
    searchTerm,
    statusFilter,
    draftMessage,
    isLoadingList,
    isLoadingDetail,
    isSending,
    isUpdatingStatus,
    statusOptions,
    ticketStatusOptions,
    filteredChats,
    loadChats,
    loadChatDetail,
    handleSelectChat,
    handleSendMessage,
    handleStatusChange,
    formatTime,
    statusSeverity,
  }
}
