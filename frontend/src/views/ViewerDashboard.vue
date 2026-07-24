<template>
  <div class="flex min-h-screen flex-col bg-slate-950">
    <Navbar />

    <main class="flex-1 px-6 py-8">
      <div class="mx-auto max-w-screen-2xl">
        <!-- Header -->
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-white">Live Dashboard</h2>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ sessionCount > 0
                ? `Watching ${sessionCount} active sharer${sessionCount > 1 ? 's' : ''}`
                : 'Waiting for sharers to connect…' }}
            </p>
          </div>

          <!-- Live count badge -->
          <div
            v-if="sessionCount > 0"
            class="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5"
          >
            <span class="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span class="text-sm font-semibold text-red-400">{{ sessionCount }} LIVE</span>
          </div>
        </div>

        <!-- Empty state -->
        <Transition name="fade">
          <div
            v-if="sessionCount === 0"
            class="flex flex-col items-center justify-center py-32 text-center"
          >
            <div class="mb-5 rounded-3xl bg-slate-900 p-6">
              <MonitorIcon class="h-12 w-12 text-slate-700" />
            </div>
            <h3 class="text-base font-semibold text-slate-400">No Active Sharers</h3>
            <p class="mt-2 max-w-xs text-sm text-slate-600">
              Sharers will appear here automatically when they start sharing their screen.
            </p>
            <!-- Pulsing waiting indicator -->
            <div class="mt-8 flex items-center gap-2 text-xs text-slate-700">
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-700 [animation-delay:-0.3s]" />
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-700 [animation-delay:-0.15s]" />
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-700" />
              <span class="ml-2">Waiting for connections</span>
            </div>
          </div>
        </Transition>

        <!-- Video Grid — auto columns based on count -->
        <TransitionGroup
          v-if="sessionCount > 0"
          name="grid-item"
          tag="div"
          :class="gridClass"
        >
          <VideoCard
            v-for="session in sessions"
            :key="session.userId"
            :username="session.username"
            :stream="session.stream"
          />
        </TransitionGroup>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { MonitorIcon } from 'lucide-vue-next'
import Navbar from '@/components/Navbar.vue'
import VideoCard from '@/components/VideoCard.vue'
import { useSignalR } from '@/composables/useSignalR'
import { useWebRtcViewer } from '@/composables/useWebRtcViewer'
import { useStreamStore } from '@/stores/streamStore'

const { connect, disconnect, invoke, onReconnected } = useSignalR()
const { registerHubHandlers, unregisterHubHandlers } = useWebRtcViewer()
const streamStore = useStreamStore()

const sessions = computed(() => [...streamStore.activeSessions.values()])
const sessionCount = computed(() => sessions.value.length)

// Responsive grid: 1 → 2 → 3 → 4 columns
const gridClass = computed(() => {
  const n = sessionCount.value
  if (n === 1) return 'grid grid-cols-1 gap-5 max-w-2xl mx-auto'
  if (n === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-5'
  if (n <= 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
  return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
})

onReconnected(async () => {
  console.log('[ViewerDashboard] Reconnected to SignalR hub! Requesting Join...')
  await invoke('Join')
})

onMounted(async () => {
  await connect()
  registerHubHandlers()
  await invoke('Join')
})

onUnmounted(async () => {
  unregisterHubHandlers()
  streamStore.clearSessions()
  await disconnect()
})
</script>

<style scoped>
/* Grid item enter/leave transitions */
.grid-item-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.grid-item-leave-active {
  transition: all 0.25s ease;
}
.grid-item-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(12px);
}
.grid-item-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
/* Fade for empty state */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
