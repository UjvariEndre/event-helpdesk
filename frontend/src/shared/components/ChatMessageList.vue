<script setup lang="ts">
import type { HelpdeskMessage, SenderType } from '@/shared/types/helpdesk'

defineProps<{
  messages: HelpdeskMessage[]
  formatTime: (value: string) => string
}>()

function isRightAligned(senderType: SenderType) {
  return senderType === 'agent'
}

function bubbleClasses(senderType: SenderType) {
  if (senderType === 'agent') {
    return 'bg-slate-900 text-white'
  }

  if (senderType === 'assistant') {
    return 'bg-amber-50 text-slate-800 ring-1 ring-inset ring-amber-200'
  }

  return 'bg-white text-slate-800 ring-1 ring-inset ring-slate-200'
}

function senderAccent(senderType: SenderType) {
  if (senderType === 'agent') {
    return 'text-slate-200'
  }

  if (senderType === 'assistant') {
    return 'text-amber-700'
  }

  return 'text-slate-500'
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 px-5 py-5">
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
            class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
            :class="senderAccent(message.senderType)"
          >
            <span class="font-semibold">{{ message.senderLabel }}</span>
            <span>{{ formatTime(message.createdAt) }}</span>
          </div>

          <p class="whitespace-pre-wrap break-words text-sm leading-6">
            {{ message.content }}
          </p>
        </article>
      </div>
    </div>
  </div>
</template>
