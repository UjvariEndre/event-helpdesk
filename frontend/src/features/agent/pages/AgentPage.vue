<script setup lang="ts">
import ChatComposer from '@/shared/components/ChatComposer.vue'
import ChatHeader from '@/shared/components/ChatHeader.vue'
import ChatMessageList from '@/shared/components/ChatMessageList.vue'
import ChatSidebar from '@/shared/components/ChatSidebar.vue'
import { useHelpdeskConversations } from '@/shared/composables/useHelpdeskConversations'
import { useVoiceHelpdesk } from '@/shared/composables/useVoiceHelpdesk'
import { onMounted } from 'vue'

const {
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
  handleSelectChat,
  handleSendMessage,
  handleStatusChange,
  formatTime,
  statusSeverity,
} = useHelpdeskConversations()

const { isSupported, speak } = useVoiceHelpdesk(() => {})

onMounted(async () => {
  await loadChats()
})
</script>

<template>
  <div class="h-[calc(100vh-3.5rem)] min-h-[40rem] bg-slate-100 p-4 sm:p-6">
    <div
      class="grid h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[22rem_minmax(0,1fr)]"
    >
      <ChatSidebar
        :chats="filteredChats"
        :selected-chat-id="selectedChatId"
        :search-term="searchTerm"
        :status-filter="statusFilter"
        :status-options="statusOptions"
        :format-time="formatTime"
        :status-severity="statusSeverity"
        @update:search-term="searchTerm = $event"
        @update:status-filter="statusFilter = $event"
        @select="handleSelectChat"
      />

      <section class="flex min-h-0 flex-1 flex-col bg-white">
        <div
          v-if="!selectedChat && (isLoadingList || isLoadingDetail)"
          class="flex flex-1 items-center justify-center text-sm text-slate-500"
        >
          Loading conversations...
        </div>

        <template v-else-if="selectedChat">
          <ChatHeader
            :chat="selectedChat"
            :status-options="ticketStatusOptions"
            :status-severity="statusSeverity"
            @update:status="handleStatusChange"
          />

          <ChatMessageList
            :messages="selectedChat.messages"
            :format-time="formatTime"
            :voice-enabled="isSupported"
            viewer="agent"
            @speak="speak"
          />

          <ChatComposer
            v-model="draftMessage"
            :disabled="isSending || isUpdatingStatus"
            :show-voice-button="true"
            :is-voice-supported="false"
            :is-listening="false"
            placeholder="Write a reply to the user"
            send-label="Send reply"
            @clear="draftMessage = ''"
            @send="handleSendMessage"
          />
        </template>

        <div
          v-else
          class="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-500"
        >
          No chat selected.
        </div>
      </section>
    </div>
  </div>
</template>
