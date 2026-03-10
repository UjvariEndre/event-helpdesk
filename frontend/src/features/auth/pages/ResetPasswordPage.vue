<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useMutation } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { computed, reactive, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { updatePassword } from '../api/update-password'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  password: '',
  confirmPassword: '',
})

const passwordsMatch = computed(() => {
  return form.password.length > 0 && form.password === form.confirmPassword
})

const mutation = useMutation({
  mutationFn: async () => {
    if (!passwordsMatch.value) {
      throw new Error('Passwords do not match')
    }

    return updatePassword(form.password)
  },
  onSuccess: async () => {
    authStore.setRecoveryMode(false)

    if (authStore.role === 'agent') {
      await router.push('/agent')
      return
    }

    await router.push('/events')
  },
})

const errorMessage = computed(() => {
  const err = mutation.error.value
  return err instanceof Error ? err.message : 'Failed to update password'
})

watchEffect(() => {
  if (!authStore.isLoading && !authStore.isRecoveryMode && !authStore.user) {
    router.replace('/login')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <Card class="w-full max-w-md">
      <template #title>Reset password</template>

      <template #content>
        <form class="flex flex-col gap-4" @submit.prevent="mutation.mutate()">
          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium">New password</label>
            <Password id="password" v-model="form.password" :feedback="false" toggleMask />
          </div>

          <div class="flex flex-col gap-2">
            <label for="confirmPassword" class="text-sm font-medium">Confirm password</label>
            <Password
              id="confirmPassword"
              v-model="form.confirmPassword"
              :feedback="false"
              toggleMask
            />
          </div>

          <Message v-if="form.confirmPassword && !passwordsMatch" severity="warn">
            Passwords do not match
          </Message>

          <Message v-if="mutation.isError.value" severity="error">
            {{ errorMessage }}
          </Message>

          <Button
            type="submit"
            label="Update password"
            :loading="mutation.isPending.value"
            :disabled="!passwordsMatch"
          />
        </form>
      </template>
    </Card>
  </div>
</template>
