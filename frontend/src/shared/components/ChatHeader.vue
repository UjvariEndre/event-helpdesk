<script setup lang="ts">
import type { ChatStatus, HelpdeskChatDetail } from '@/shared/types/helpdesk'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

defineProps<{
  chat: HelpdeskChatDetail
  statusOptions: Array<{ label: string; value: ChatStatus }>
  statusSeverity: (status: ChatStatus) => 'info' | 'warn' | 'success'
}>()

const emit = defineEmits<{
  'update:status': [value: ChatStatus]
}>()
</script>

<template>
  <header class="border-b border-slate-200 bg-white px-5 py-4">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="min-w-0 space-y-2">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-xl font-semibold text-slate-900">{{ chat.subject }}</h2>
          <Tag :severity="statusSeverity(chat.status)" :value="chat.status" rounded />
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
          <span>{{ chat.user.email }}</span>
          <span>
            {{
              chat.assignedAgent ? `Assigned to ${chat.assignedAgent.name}` : 'No assigned agent'
            }}
          </span>
        </div>
      </div>

      <div class="w-full xl:max-w-56">
        <label class="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Ticket status
        </label>

        <Select
          :model-value="chat.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          @update:model-value="emit('update:status', $event)"
        />
      </div>
    </div>
  </header>
</template>
