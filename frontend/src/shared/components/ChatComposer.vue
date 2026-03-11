<script setup lang="ts">
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'

defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
  send: []
}>()
</script>

<template>
  <footer class="border-t border-slate-200 bg-white px-5 py-4">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <Textarea
        :model-value="modelValue"
        rows="4"
        auto-resize
        class="w-full"
        placeholder="Write a reply to the user"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event ?? '')"
      />

      <div class="flex items-center justify-end gap-3">
        <Button
          label="Clear"
          severity="secondary"
          variant="outlined"
          :disabled="disabled || !modelValue.trim()"
          @click="emit('clear')"
        />
        <Button
          label="Send reply"
          icon="pi pi-send"
          :disabled="disabled || !modelValue.trim()"
          @click="emit('send')"
        />
      </div>
    </div>
  </footer>
</template>
