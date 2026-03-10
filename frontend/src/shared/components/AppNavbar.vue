<script setup lang="ts">
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()

const isUser = computed(() => auth.role === 'user')

async function logout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<template>
  <header class="w-full border-b bg-white">
    <div class="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
      <!-- left side -->
      <div class="font-semibold text-lg">Events + Helpdesk App 1.0</div>

      <!-- center nav -->
      <nav class="flex gap-6" v-if="isUser">
        <RouterLink
          to="/events"
          class="text-sm font-medium hover:text-blue-600"
          active-class="text-blue-600"
        >
          Events
        </RouterLink>

        <RouterLink
          to="/helpdesk"
          class="text-sm font-medium hover:text-blue-600"
          active-class="text-blue-600"
        >
          Helpdesk
        </RouterLink>
      </nav>

      <!-- right side -->
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">
          {{ auth.user?.email }}
        </span>

        <Button
          label="Logout"
          icon="pi pi-sign-out"
          severity="secondary"
          size="small"
          @click="logout"
        />
      </div>
    </div>
  </header>
</template>
