import {
  getAgentChatById,
  getAgentChats,
  patchAgentChat,
  postAgentChatMessage,
} from '@/features/agent/api/agent-helpdesk'
import { getHelpdeskChat, postHelpdeskChatMessage } from '@/features/helpdesk/api/helpdesk'
import { supabase, syncRealtimeAuth } from '@/shared/lib/supabase'
import type { ChatStatus, HelpdeskChatDetail, HelpdeskChatListItem } from '@/shared/types/helpdesk'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
  const isRefreshingList = ref(false)
  const isLoadingDetail = ref(false)
  const isSending = ref(false)
  const isUpdatingStatus = ref(false)

  let chatRealtimeChannel: RealtimeChannel | null = null
  let listRealtimeChannel: RealtimeChannel | null = null
  let refreshPromise: Promise<void> | null = null
  let refreshQueued = false

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

  onMounted(async () => {
    await setupListRealtimeSubscription()
    await loadChats()
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
      refreshQueued = true
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

        const requestedChatId = selectedChatId.value
        const chat = await getAgentChatById(requestedChatId)

        if (selectedChatId.value !== requestedChatId) {
          return
        }

        selectedChat.value = chat
        upsertChatListItem(chat)
      } finally {
        refreshPromise = null

        if (refreshQueued) {
          refreshQueued = false
          void refreshSelectedChatFromServer()
        }
      }
    })()

    return refreshPromise
  }

  let listRefreshPromise: Promise<void> | null = null

  async function refreshChatListFromServer() {
    if (listRefreshPromise) {
      return listRefreshPromise
    }

    listRefreshPromise = (async () => {
      try {
        await loadChats({ silent: true })
      } finally {
        listRefreshPromise = null
      }
    })()

    return listRefreshPromise
  }

  function cleanupChatRealtimeSubscription() {
    if (chatRealtimeChannel) {
      supabase.removeChannel(chatRealtimeChannel)
      chatRealtimeChannel = null
    }
  }

  function cleanupListRealtimeSubscription() {
    if (listRealtimeChannel) {
      supabase.removeChannel(listRealtimeChannel)
      listRealtimeChannel = null
    }
  }

  let selectedRefreshTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleSelectedChatRefresh() {
    if (selectedRefreshTimer) {
      clearTimeout(selectedRefreshTimer)
    }

    selectedRefreshTimer = setTimeout(() => {
      void refreshSelectedChatFromServer()
    }, 150)
  }

  async function setupChatRealtimeSubscription(chatId: string | null) {
    cleanupChatRealtimeSubscription()

    if (!chatId) {
      return
    }

    await syncRealtimeAuth()

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
        (payload) => {
          console.log('[chat_messages event]', mode, chatId, payload)
          scheduleSelectedChatRefresh()
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
        (payload) => {
          console.log('[chats event]', mode, chatId, payload)
          scheduleSelectedChatRefresh()
        },
      )
      .subscribe((status) => {
        console.log('[chatRealtime]', chatId, status)
      })
  }

  let listRefreshTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleChatListRefresh() {
    if (listRefreshTimer) {
      clearTimeout(listRefreshTimer)
    }

    listRefreshTimer = setTimeout(() => {
      void refreshChatListFromServer()
    }, 250)
  }

  async function setupListRealtimeSubscription() {
    cleanupListRealtimeSubscription()

    if (mode !== 'agent') {
      return
    }

    await syncRealtimeAuth()

    listRealtimeChannel = supabase
      .channel('helpdesk-chat-list-agent')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          scheduleChatListRefresh()
        },
      )
      .subscribe((status) => {
        console.log('[listRealtime]', status)
      })
  }

  async function loadChats(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false

    if (silent) {
      isRefreshingList.value = true
    } else {
      isLoadingList.value = true
    }

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

      const firstChat = result[0]

      if (!selectedChatId.value && firstChat) {
        const nextSelectedId = firstChat.id
        selectedChatId.value = nextSelectedId
        await loadChatDetail(nextSelectedId, { silent })
      }
    } finally {
      if (silent) {
        isRefreshingList.value = false
      } else {
        isLoadingList.value = false
      }
    }
  }

  async function loadChatDetail(chatId: string, options?: { silent?: boolean }) {
    if (mode === 'user') {
      return
    }

    const silent = options?.silent ?? false

    selectedChatId.value = chatId

    if (!silent) {
      isLoadingDetail.value = true
    }

    try {
      selectedChat.value = await getAgentChatById(chatId)
    } finally {
      if (!silent) {
        isLoadingDetail.value = false
      }
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

  const sendError = ref<string | null>(null)

  async function handleSendMessage() {
    if (!draftMessage.value.trim() || isSending.value) {
      return
    }

    isSending.value = true
    sendError.value = null

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
    } catch (error) {
      console.error('handleSendMessage failed', error)
      sendError.value = error instanceof Error ? error.message : 'Failed to send message'
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
      void setupChatRealtimeSubscription(chatId)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (listRefreshTimer) {
      clearTimeout(listRefreshTimer)
    }

    if (selectedRefreshTimer) {
      clearTimeout(selectedRefreshTimer)
    }

    cleanupChatRealtimeSubscription()
    cleanupListRealtimeSubscription()
  })

  return {
    chats,
    selectedChat,
    selectedChatId,
    searchTerm,
    statusFilter,
    draftMessage,
    isLoadingList,
    isRefreshingList,
    isLoadingDetail,
    isSending,
    isUpdatingStatus,
    sendError,
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
