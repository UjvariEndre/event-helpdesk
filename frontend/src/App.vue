<script setup lang="ts">
import AppNavbar from '@/shared/components/AppNavbar.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppNavbar v-if="auth.user" />

    <RouterView />
  </div>
</template>
