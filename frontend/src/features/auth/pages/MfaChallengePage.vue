<script setup lang="ts">
import { supabase, syncRealtimeAuth } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useMutation } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { computed, reactive, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { getMfaAal } from '../api/get-mfa-aal'
import { verifyMfaCode } from '../api/verify-mfa'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  code: '',
})

const mutation = useMutation({
  mutationFn: async () => verifyMfaCode(form.code.trim()),
  onSuccess: async () => {
    const aal = await getMfaAal()

    authStore.setMfaState({
      required: true,
      verified: aal.currentLevel === 'aal2',
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    await syncRealtimeAuth(session)

    form.code = ''

    if (aal.currentLevel !== 'aal2') {
      throw new Error('MFA verification succeeded, but the session is not aal2 yet.')
    }

    await router.replace(authStore.role === 'agent' ? '/agent' : '/events')
  },
})

const errorMessage = computed(() => {
  const err = mutation.error.value
  return err instanceof Error ? err.message : 'MFA verification failed'
})

const isBootstrapping = computed(() => authStore.isLoading)

watchEffect(() => {
  if (isBootstrapping.value || mutation.isPending.value) {
    return
  }

  if (!authStore.user) {
    void router.replace('/login')
    return
  }

  if (authStore.isMfaRequiredForSession && !authStore.isMfaVerifiedForSession) {
    return
  }

  void router.replace(authStore.role === 'agent' ? '/agent' : '/events')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <Card class="w-full max-w-md">
      <template #title>Multi-factor authentication</template>

      <template #content>
        <div v-if="isBootstrapping" class="flex flex-col items-center gap-3 py-6">
          <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
          <p class="text-sm text-slate-600">Checking your authentication status...</p>
        </div>

        <form v-else class="flex flex-col gap-4" @submit.prevent="mutation.mutate()">
          <p class="text-sm text-slate-600">Enter the 6-digit code from your authenticator app.</p>

          <div class="flex flex-col gap-2">
            <label for="code" class="text-sm font-medium">Authentication code</label>
            <InputText
              id="code"
              v-model="form.code"
              inputmode="numeric"
              maxlength="6"
              placeholder="123456"
            />
          </div>

          <Message v-if="mutation.isError.value" severity="error">
            {{ errorMessage }}
          </Message>

          <Button
            type="submit"
            label="Verify"
            :loading="mutation.isPending.value"
            :disabled="form.code.trim().length !== 6"
          />
        </form>
      </template>
    </Card>
  </div>
</template>
