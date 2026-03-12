<script setup lang="ts">
import type { HelpdeskMessage, SenderType } from '@/shared/types/helpdesk'
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{
  messages: HelpdeskMessage[]
  formatTime: (value: string) => string
  viewer?: 'user' | 'agent'
  voiceEnabled?: boolean
}>()

const emit = defineEmits<{
  speak: [text: string]
}>()

const currentViewer = computed(() => props.viewer ?? 'agent')
const scrollContainer = ref<HTMLElement | null>(null)

function isOwnMessage(senderType: SenderType) {
  if (senderType === 'assistant') {
    return false
  }

  return senderType === currentViewer.value
}

function isRightAligned(senderType: SenderType) {
  return isOwnMessage(senderType)
}

function bubbleClasses(senderType: SenderType) {
  if (senderType === 'assistant') {
    return 'bg-violet-50 text-violet-800 ring-1 ring-inset ring-violet-200'
  }

  if (isOwnMessage(senderType)) {
    return 'bg-indigo-600 text-white'
  }

  return 'bg-white text-slate-800 ring-1 ring-inset ring-slate-200'
}

function senderAccent(senderType: SenderType) {
  if (senderType === 'assistant') {
    return 'text-violet-700'
  }

  if (isOwnMessage(senderType)) {
    return 'text-indigo-200'
  }

  return 'text-slate-500'
}

async function scrollToBottom() {
  await nextTick()

  if (!scrollContainer.value) {
    return
  }

  scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
}

watch(
  () => props.messages.length,
  async () => {
    await scrollToBottom()
  },
  { immediate: true },
)
</script>

<template>
  <div
    ref="scrollContainer"
    class="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 px-5 py-5"
  >
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex"
        :class="isRightAligned(message.senderType) ? 'justify-end' : 'justify-start'"
      >
        <article
          class="max-w-2xl rounded-2xl px-4 py-3 shadow-sm"
          :class="bubbleClasses(message.senderType)"
        >
          <div
            class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs justify-between"
            :class="senderAccent(message.senderType)"
          >
            <div class="flex gap-3">
              <span class="font-semibold">{{ message.senderLabel }}</span>
              <span>{{ formatTime(message.createdAt) }}</span>
            </div>

            <button
              v-if="voiceEnabled && !isOwnMessage(message.senderType)"
              type="button"
              class="inline-flex h-4 w-4 items-center justify-center rounded-full transition hover:cursor-pointer"
              :class="senderAccent(message.senderType)"
              aria-label="Read message aloud"
              @click="emit('speak', message.content)"
            >
              <i class="pi pi-volume-up text-sm" />
            </button>
          </div>

          <p class="whitespace-pre-wrap break-words text-sm leading-6">
            {{ message.content }}
          </p>
        </article>
      </div>
    </div>
  </div>
</template>
