<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { computed, reactive } from 'vue'
import { requestPasswordReset } from '../api/request-password-reset'

const form = reactive({
  email: '',
})

const mutation = useMutation({
  mutationFn: async () => requestPasswordReset(form.email),
})

const errorMessage = computed(() => {
  const err = mutation.error.value
  return err instanceof Error ? err.message : 'Failed to send reset email'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <Card class="w-full max-w-md">
      <template #title>Forgot password</template>

      <template #content>
        <form class="flex flex-col gap-4" @submit.prevent="mutation.mutate()">
          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <InputText id="email" v-model="form.email" type="email" placeholder="user@test.com" />
          </div>

          <Message v-if="mutation.isError.value" severity="error">
            {{ errorMessage }}
          </Message>

          <Message v-if="mutation.isSuccess.value" severity="success">
            Password reset email sent. Check your inbox.
          </Message>

          <Button type="submit" label="Send reset link" :loading="mutation.isPending.value" />
        </form>
      </template>
    </Card>
  </div>
</template>
