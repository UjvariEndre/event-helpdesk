<script setup lang="ts">
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'

withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    sendLabel?: string
    placeholder?: string
    showVoiceButton?: boolean
    isVoiceSupported?: boolean
    isListening?: boolean
  }>(),
  {
    disabled: false,
    sendLabel: 'Send',
    placeholder: 'Write a reply to the user',
    showVoiceButton: false,
    isVoiceSupported: false,
    isListening: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
  send: []
  voiceToggle: []
}>()
</script>

<template>
  <div v-if="isVoiceSupported" class="flex items-center border-t border-slate-200 px-5 py-3">
    <span class="text-sm text-slate-500">
      {{ isListening ? 'Listening...' : 'Voice input available' }}
    </span>
  </div>
  <footer class="border-t border-slate-200 bg-white px-5 py-4">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <Textarea
        :model-value="modelValue"
        rows="4"
        auto-resize
        class="w-full"
        :placeholder="placeholder"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event ?? '')"
      />

      <div class="flex items-center justify-end gap-3">
        <Button
          v-if="showVoiceButton && isVoiceSupported"
          :label="isListening ? 'Stop voice input' : 'Start voice input'"
          icon="pi pi-microphone"
          severity="secondary"
          variant="outlined"
          :disabled="disabled"
          @click="emit('voiceToggle')"
        />

        <Button
          label="Clear"
          severity="secondary"
          variant="outlined"
          :disabled="disabled || !modelValue.trim()"
          @click="emit('clear')"
        />

        <Button
          label="Send"
          icon="pi pi-send"
          :disabled="disabled || !modelValue.trim()"
          @click="emit('send')"
        />
      </div>
    </div>
  </footer>
</template>
