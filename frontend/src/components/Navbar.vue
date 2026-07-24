<template>
  <header class="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-3">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <MonitorIcon class="h-4 w-4 text-white" />
        </div>
        <span class="text-sm font-semibold tracking-wide text-white">ScreenShare</span>
      </div>

      <!-- Right: user info + badge + logout -->
      <div class="flex items-center gap-4">
        <!-- Role badge -->
        <span
          :class="isSharer
            ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30'
            : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'"
          class="rounded-full px-2.5 py-0.5 text-xs font-medium"
        >
          {{ isSharer ? 'Sharer' : 'Viewer' }}
        </span>

        <!-- Username -->
        <div class="flex items-center gap-2 text-sm text-slate-300">
          <UserCircle2Icon class="h-4 w-4 text-slate-500" />
          <span>{{ username }}</span>
        </div>

        <!-- Logout -->
        <button
          @click="handleLogout"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400
                 transition-all hover:bg-white/5 hover:text-white"
        >
          <LogOutIcon class="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { MonitorIcon, UserCircle2Icon, LogOutIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const username = computed(() => authStore.user?.username ?? '')
const isSharer = computed(() => authStore.isSharer)

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
