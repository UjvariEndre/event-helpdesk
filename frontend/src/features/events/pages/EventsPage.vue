<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import { computed, reactive, ref } from 'vue'
import { createEvent } from '../api/create-event'
import { deleteEvent } from '../api/delete-event'
import { getEvents } from '../api/get-events'
import { updateEvent } from '../api/update-event'
import type { EventItem } from '../types/event'

const authStore = useAuthStore()
const queryClient = useQueryClient()

const isCreateDialogOpen = ref(false)
const isEditMode = ref(false)
const editingEventId = ref<string | null>(null)

const form = reactive({
  title: '',
  description: '',
  occurrence: new Date(),
})

const createErrorMessage = computed(() => {
  const err = createEventMutation.error.value
  return err instanceof Error ? err.message : 'Failed to create event'
})

const updateErrorMessage = computed(() => {
  const err = updateEventMutation.error.value
  return err instanceof Error ? err.message : 'Failed to update event'
})

const eventsQuery = useQuery({
  queryKey: ['events', authStore.user?.id],
  queryFn: getEvents,
  enabled: !!authStore.user?.id,
})

const createEventMutation = useMutation({
  mutationFn: async () => {
    return createEvent({
      title: form.title,
      description: form.description,
      occurrence: form.occurrence.toISOString(),
    })
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['events', authStore.user?.id] })

    form.title = ''
    form.description = ''
    form.occurrence = new Date()
    isCreateDialogOpen.value = false
  },
})

const deleteEventMutation = useMutation({
  mutationFn: deleteEvent,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['events', authStore.user?.id] })
  },
})

function resetForm() {
  form.title = ''
  form.description = ''
  form.occurrence = new Date()

  editingEventId.value = null
  isEditMode.value = false
  isCreateDialogOpen.value = false
}

const updateEventMutation = useMutation({
  mutationFn: updateEvent,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['events', authStore.user?.id] })

    resetForm()
  },
})

function handleDelete(id: string) {
  deleteEventMutation.mutate(id)
}

function handleSubmit() {
  if (isEditMode.value) {
    if (!editingEventId.value) return

    updateEventMutation.mutate({
      id: editingEventId.value,
      description: form.description,
    })
  } else {
    createEventMutation.mutate()
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function openEditDialog(event: EventItem) {
  isEditMode.value = true
  editingEventId.value = event.id

  form.title = event.title
  form.description = event.description ?? ''
  form.occurrence = new Date(event.occurrence)

  isCreateDialogOpen.value = true
}

function openCreateDialog() {
  resetForm()
  isCreateDialogOpen.value = true
}
</script>

<template>
  <div class="p-6">
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span>Events</span>

          <Button label="Create event" icon="pi pi-plus" @click="openCreateDialog" />
        </div>
      </template>

      <template #content>
        <DataTable
          :value="eventsQuery.data.value ?? []"
          :loading="eventsQuery.isLoading.value"
          dataKey="id"
        >
          <Column field="title" header="Title" />
          <Column field="description" header="Description" />
          <Column header="Occurrence">
            <template #body="{ data }">
              {{ formatDate(data.occurrence) }}
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  severity="secondary"
                  size="small"
                  @click="openEditDialog(data)"
                />
                <Button
                  label="Delete"
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  variant="outlined"
                  :loading="deleteEventMutation.isPending.value"
                  @click="handleDelete(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog
      v-model:visible="isCreateDialogOpen"
      modal
      :header="isEditMode ? 'Edit Event' : 'Create Event'"
      class="w-full max-w-xl"
    >
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-2">
          <label for="title" class="text-sm font-medium">Title</label>
          <InputText
            id="title"
            v-model="form.title"
            placeholder="Enter event title"
            :disabled="isEditMode"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="description" class="text-sm font-medium">Description</label>
          <Textarea
            id="description"
            v-model="form.description"
            rows="4"
            placeholder="Optional description"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="occurrence" class="text-sm font-medium">Occurrence</label>
          <DatePicker
            id="occurrence"
            v-model="form.occurrence"
            showTime
            hourFormat="24"
            fluid
            :disabled="isEditMode"
          />
        </div>

        <Message v-if="!isEditMode && createEventMutation.isError.value" severity="error">
          {{ createErrorMessage }}
        </Message>

        <Message v-if="isEditMode && updateEventMutation.isError.value" severity="error">
          {{ updateErrorMessage }}
        </Message>

        <div class="flex justify-end">
          <Button
            type="submit"
            :label="isEditMode ? 'Update' : 'Save'"
            :loading="
              isEditMode ? updateEventMutation.isPending.value : createEventMutation.isPending.value
            "
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>
