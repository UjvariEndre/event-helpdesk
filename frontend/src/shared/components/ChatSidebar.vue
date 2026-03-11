<script setup lang="ts">
import type { ChatStatus, HelpdeskChatListItem } from '@/shared/types/helpdesk'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

defineProps<{
  chats: HelpdeskChatListItem[]
  selectedChatId: string | null
  searchTerm: string
  statusFilter: ChatStatus | 'all'
  statusOptions: Array<{ label: string; value: ChatStatus | 'all' }>
  formatTime: (value: string) => string
  statusSeverity: (status: ChatStatus) => 'info' | 'warn' | 'success'
}>()

const emit = defineEmits<{
  'update:searchTerm': [value: string]
  'update:statusFilter': [value: ChatStatus | 'all']
  select: [chatId: string]
}>()
</script>

<template>
  <aside
    class="flex h-full min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r"
  >
    <div class="border-b border-slate-200 p-4">
      <div class="mb-4">
        <h1 class="text-lg font-semibold text-slate-900">Helpdesk</h1>
        <p class="text-sm text-slate-500">Agent conversations and ticket status</p>
      </div>

      <div class="space-y-3">
        <InputText
          :model-value="searchTerm"
          placeholder="Search by subject or email"
          class="w-full"
          @update:model-value="emit('update:searchTerm', $event ?? '')"
        />

        <Select
          :model-value="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          placeholder="Filter by status"
          class="w-full"
          @update:model-value="emit('update:statusFilter', $event)"
        />
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <button
        v-for="chat in chats"
        :key="chat.id"
        type="button"
        class="flex w-full flex-col gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
        :class="
          selectedChatId === chat.id ? 'bg-slate-100 ring-1 ring-inset ring-slate-200' : 'bg-white'
        "
        @click="emit('select', chat.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate font-medium text-slate-900">{{ chat.subject }}</div>
            <div class="truncate text-sm text-slate-500">{{ chat.user.email }}</div>
          </div>

          <div class="shrink-0 text-xs text-slate-400">
            {{ formatTime(chat.updatedAt) }}
          </div>
        </div>

        <div class="line-clamp-2 text-sm text-slate-600">
          {{ chat.lastMessagePreview ?? 'No messages yet' }}
        </div>

        <div class="flex items-center justify-between gap-3">
          <Tag :severity="statusSeverity(chat.status)" :value="chat.status" rounded />

          <div class="truncate text-xs text-slate-500">
            {{ chat.assignedAgent ? `Assigned to ${chat.assignedAgent.name}` : 'Unassigned' }}
          </div>
        </div>
      </button>

      <div
        v-if="!chats.length"
        class="flex h-full min-h-64 items-center justify-center px-6 text-center text-sm text-slate-500"
      >
        No chats match the current filters.
      </div>
    </div>
  </aside>
</template>
