<script setup lang="ts">
import ChatComposer from '@/shared/components/ChatComposer.vue'
import ChatMessageList from '@/shared/components/ChatMessageList.vue'
import { useHelpdeskConversations } from '@/shared/composables/useHelpdeskConversations'
import { useVoiceHelpdesk } from '@/shared/composables/useVoiceHelpdesk'
import Tag from 'primevue/tag'
import { computed, onMounted, watch } from 'vue'

const {
  selectedChat,
  draftMessage,
  isLoadingList,
  isLoadingDetail,
  isSending,
  loadChats,
  handleSendMessage,
  formatTime,
  statusSeverity,
} = useHelpdeskConversations({ mode: 'user' })

const { isSupported, isListening, start, stop, speak } = useVoiceHelpdesk(async (text) => {
  draftMessage.value = text
  await handleSendMessage()
})

watch(
  () => {
    const messages = selectedChat.value?.messages
    return messages?.[messages.length - 1]
  },
  (lastMessage, previousMessage) => {
    if (!lastMessage) {
      return
    }

    if (lastMessage.id === previousMessage?.id) {
      return
    }

    if (lastMessage.senderType === 'assistant') {
      speak(lastMessage.content)
    }
  },
)

const pageTitle = computed(() => selectedChat.value?.subject ?? 'Helpdesk conversation')
const pageStatus = computed(() => selectedChat.value?.status ?? null)

onMounted(async () => {
  await loadChats()
})
</script>

<template>
  <div class="h-[calc(100vh-3.5rem)] min-h-[40rem] bg-slate-100 p-4 sm:p-6">
    <div
      class="flex h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <section class="flex min-h-0 flex-1 flex-col bg-white">
        <div
          v-if="isLoadingList || isLoadingDetail"
          class="flex flex-1 items-center justify-center text-sm text-slate-500"
        >
          Loading conversation...
        </div>

        <template v-else-if="selectedChat">
          <header class="border-b border-slate-200 bg-white px-5 py-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="mb-2 flex flex-wrap items-center gap-3">
                  <h1 class="truncate text-xl font-semibold text-slate-900">
                    {{ pageTitle }}
                  </h1>

                  <Tag
                    v-if="pageStatus"
                    :severity="statusSeverity(pageStatus)"
                    :value="pageStatus"
                    rounded
                  />
                </div>

                <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span>{{ selectedChat.user.email }}</span>
                  <span>
                    {{
                      selectedChat.assignedAgent
                        ? `Assigned to ${selectedChat.assignedAgent.name}`
                        : 'Unassigned'
                    }}
                  </span>
                  <span>Updated {{ formatTime(selectedChat.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </header>

          <ChatMessageList
            :messages="selectedChat.messages"
            :format-time="formatTime"
            viewer="user"
          />

          <ChatComposer
            v-model="draftMessage"
            :disabled="isSending"
            :show-voice-button="true"
            :is-voice-supported="isSupported"
            :is-listening="isListening"
            placeholder="Describe your problem..."
            send-label="Send message"
            @clear="draftMessage = ''"
            @send="handleSendMessage"
            @voice-toggle="isListening ? stop() : start()"
          />
        </template>

        <template v-else>
          <div
            class="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-500"
          >
            Start a new helpdesk conversation by sending your first message.
          </div>

          <ChatComposer
            v-model="draftMessage"
            :disabled="isSending"
            :show-voice-button="true"
            :is-voice-supported="isSupported"
            :is-listening="isListening"
            placeholder="Describe your problem..."
            send-label="Send message"
            @clear="draftMessage = ''"
            @send="handleSendMessage"
            @voice-toggle="isListening ? stop() : start()"
          />
        </template>
      </section>
    </div>
  </div>
</template>
