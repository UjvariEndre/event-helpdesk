import {
  getAgentChatById,
  getAgentChats,
  patchAgentChat,
  postAgentChatMessage,
} from '@/features/agent/api/agent-helpdesk'
import { getHelpdeskChat, postHelpdeskChatMessage } from '@/features/helpdesk/api/helpdesk'
import { supabase } from '@/shared/lib/supabase'
import type { ChatStatus, HelpdeskChatDetail, HelpdeskChatListItem } from '@/shared/types/helpdesk'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type UseHelpdeskConversationsOptions = {
  mode?: 'agent' | 'user'
}

export function useHelpdeskConversations(options: UseHelpdeskConversationsOptions = {}) {
  const mode = options.mode ?? 'agent'

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

  let chatRealtimeChannel: RealtimeChannel | null = null
  let refreshPromise: Promise<void> | null = null

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

  async function refreshSelectedChatFromServer() {
    if (refreshPromise) {
      return refreshPromise
    }

    refreshPromise = (async () => {
      try {
        if (mode === 'user') {
          const chat = await getHelpdeskChat()

          if (!chat) {
            chats.value = []
            selectedChat.value = null
            selectedChatId.value = null
            return
          }

          selectedChat.value = chat
          selectedChatId.value = chat.id
          upsertChatListItem(chat)
          return
        }

        if (!selectedChatId.value) {
          return
        }

        const chat = await getAgentChatById(selectedChatId.value)
        selectedChat.value = chat
        upsertChatListItem(chat)
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  function cleanupRealtimeSubscription() {
    if (chatRealtimeChannel) {
      supabase.removeChannel(chatRealtimeChannel)
      chatRealtimeChannel = null
    }
  }

  function setupRealtimeSubscription(chatId: string | null) {
    cleanupRealtimeSubscription()

    if (!chatId) {
      return
    }

    chatRealtimeChannel = supabase
      .channel(`helpdesk-chat-${mode}-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async () => {
          await refreshSelectedChatFromServer()
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `id=eq.${chatId}`,
        },
        async () => {
          await refreshSelectedChatFromServer()
        },
      )
      .subscribe()
  }

  async function loadChats() {
    isLoadingList.value = true

    try {
      if (mode === 'user') {
        const chat = await getHelpdeskChat()

        if (!chat) {
          chats.value = []
          selectedChat.value = null
          selectedChatId.value = null
          return
        }

        chats.value = [
          {
            id: chat.id,
            subject: chat.subject,
            status: chat.status,
            user: chat.user,
            assignedAgent: chat.assignedAgent,
            lastMessagePreview: chat.lastMessagePreview,
            updatedAt: chat.updatedAt,
          },
        ]

        selectedChat.value = chat
        selectedChatId.value = chat.id
        return
      }

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
    if (mode === 'user') {
      return
    }

    selectedChatId.value = chatId
    isLoadingDetail.value = true

    try {
      selectedChat.value = await getAgentChatById(chatId)
    } finally {
      isLoadingDetail.value = false
    }
  }

  async function handleSelectChat(chatId: string) {
    if (mode === 'user') {
      return
    }

    if (selectedChatId.value === chatId && selectedChat.value) {
      return
    }

    draftMessage.value = ''
    await loadChatDetail(chatId)
  }

  async function handleSendMessage() {
    if (!draftMessage.value.trim()) {
      return
    }

    isSending.value = true

    try {
      if (mode === 'user') {
        const updatedChat = await postHelpdeskChatMessage({
          content: draftMessage.value,
        })

        selectedChat.value = updatedChat
        selectedChatId.value = updatedChat.id
        upsertChatListItem(updatedChat)
        draftMessage.value = ''
        return
      }

      if (!selectedChatId.value) {
        return
      }

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
    if (mode === 'user') {
      return
    }

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

  watch(
    selectedChatId,
    (chatId) => {
      setupRealtimeSubscription(chatId)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    cleanupRealtimeSubscription()
  })

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
