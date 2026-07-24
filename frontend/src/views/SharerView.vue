<template>
  <div class="flex min-h-screen flex-col bg-slate-950">
    <Navbar />

    <main class="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div class="w-full max-w-lg">
        <!-- Header -->
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-bold text-white">Screen Sharing</h2>
          <p class="mt-1 text-sm text-slate-500">Share your screen with connected viewers</p>
        </div>

        <!-- Main card -->
        <div class="rounded-3xl border border-white/5 bg-slate-900/60 p-8 backdrop-blur-sm">
          <!-- Status indicator -->
          <div class="mb-8 flex items-center justify-center">
            <div :class="[
              'flex items-center gap-3 rounded-2xl px-6 py-3 text-sm font-medium',
              isSharing
                ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                : 'bg-slate-800 text-slate-400'
            ]">
              <span :class="[
                'h-2 w-2 rounded-full',
                isSharing ? 'animate-pulse bg-red-500' : 'bg-slate-600'
              ]" />
              {{ isSharing ? 'Sharing is Active' : 'Not Sharing' }}
            </div>
          </div>

          <!-- Local preview -->
          <div v-if="isSharing && localStream" class="mb-8 overflow-hidden rounded-2xl border border-white/5">
            <video
              ref="previewEl"
              autoplay
              playsinline
              muted
              class="w-full max-h-56 bg-black object-contain"
            />
          </div>

          <!-- Share button -->
          <div class="flex justify-center">
            <ShareButton :is-sharing="isSharing" @toggle="handleToggle" />
          </div>

          <!-- Error -->
          <Transition name="slide-down">
            <div
              v-if="error"
              class="mt-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <AlertCircleIcon class="h-4 w-4 shrink-0 text-red-400" />
              <p class="text-sm text-red-400">{{ error }}</p>
            </div>
          </Transition>

          <!-- Info tips -->
          <div class="mt-8 space-y-2">
            <div
              v-for="tip in tips"
              :key="tip.text"
              class="flex items-start gap-3 rounded-xl px-4 py-3 text-xs text-slate-500"
            >
              <component :is="tip.icon" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
              <span>{{ tip.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { AlertCircleIcon, ShieldCheckIcon, MonitorIcon, UsersIcon } from 'lucide-vue-next'
import Navbar from '@/components/Navbar.vue'
import ShareButton from '@/components/ShareButton.vue'
import { useSignalR } from '@/composables/useSignalR'
import { useWebRtcSharer } from '@/composables/useWebRtcSharer'
import { useStreamStore } from '@/stores/streamStore'

const { connect, disconnect, invoke } = useSignalR()
const { isSharing, error, startSharing, stopSharing } = useWebRtcSharer()
const streamStore = useStreamStore()

const previewEl = ref<HTMLVideoElement | null>(null)
const localStream = computed(() => streamStore.localStream)

const tips = [
  { icon: MonitorIcon, text: 'Choose "Entire Screen" for the best monitoring coverage.' },
  { icon: ShieldCheckIcon, text: 'Your stream is sent directly to viewers via WebRTC (P2P).' },
  { icon: UsersIcon, text: 'Viewers can see your screen in real-time on their dashboard.' }
]

async function handleToggle() {
  if (isSharing.value) {
    await stopSharing()
  } else {
    await startSharing()
  }
}

watch(
  [localStream, previewEl],
  ([stream, el]) => {
    if (el) {
      el.srcObject = stream ?? null
      if (stream) {
        el.play().catch(() => {})
      }
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await connect()
  await invoke('Join')
})

onUnmounted(async () => {
  if (isSharing.value) await stopSharing()
  await disconnect()
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
