<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getProfileRole } from '../api/get-profile-role'
import { login } from '../api/login'

const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const mutation = useMutation({
  mutationFn: async () => {
    return login(form.email, form.password)
  },
  onSuccess: async (data) => {
    const userId = data.user?.id

    if (!userId) {
      await router.push('/login')
      return
    }

    const role = await getProfileRole(userId)

    if (role === 'agent') {
      await router.push('/agent')
      return
    }

    await router.push('/events')
  },
})

const errorMessage = computed(() => {
  const err = mutation.error.value
  return err instanceof Error ? err.message : 'Login failed'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <Card class="w-full max-w-md">
      <template #title> Login </template>

      <template #content>
        <form class="flex flex-col gap-4" @submit.prevent="mutation.mutate()">
          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <InputText id="email" v-model="form.email" type="email" placeholder="user@test.com" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium">Password</label>
            <Password id="password" v-model="form.password" :feedback="false" toggleMask />
          </div>

          <Message v-if="mutation.isError.value" severity="error">
            {{ errorMessage }}
          </Message>

          <Button type="submit" label="Login" :loading="mutation.isPending.value" />
        </form>
        <RouterLink to="/forgot-password" class="text-sm text-blue-600 hover:underline">
          Forgot password?
        </RouterLink>
      </template>
    </Card>
  </div>
</template>
