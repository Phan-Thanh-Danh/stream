<template>
  <div
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5
           bg-slate-900 shadow-xl shadow-black/40 transition-all duration-300
           hover:border-white/10 hover:shadow-2xl hover:shadow-black/60"
  >
    <!-- Video element -->
    <div class="relative aspect-video w-full overflow-hidden bg-slate-950">
      <video
        ref="videoEl"
        autoplay
        playsinline
        muted
        class="h-full w-full object-contain"
      />

      <!-- Overlay when no stream yet -->
      <div
        v-if="!hasStream"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3"
      >
        <div class="rounded-full bg-slate-800 p-4">
          <MonitorIcon class="h-8 w-8 text-slate-600" />
        </div>
        <span class="text-xs text-slate-600">Connecting…</span>
      </div>

      <!-- LIVE badge -->
      <div
        v-if="hasStream"
        class="absolute top-2 left-2 flex items-center gap-1.5 rounded-full
               bg-red-600/90 px-2 py-0.5 backdrop-blur-sm"
      >
        <span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        <span class="text-[10px] font-bold uppercase tracking-widest text-white">Live</span>
      </div>

      <!-- Fullscreen button (shown on hover) -->
      <button
        @click="toggleFullscreen"
        class="absolute bottom-2 right-2 rounded-lg bg-black/50 p-1.5 opacity-0 backdrop-blur-sm
               transition-opacity group-hover:opacity-100 hover:bg-black/70"
      >
        <Maximize2Icon class="h-3.5 w-3.5 text-white" />
      </button>
    </div>

    <!-- Card footer -->
    <div class="flex items-center gap-3 px-4 py-3">
      <!-- Avatar -->
      <div
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br
               from-indigo-500 to-purple-600 text-xs font-bold text-white"
      >
        {{ initials }}
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-slate-100">{{ username }}</p>
        <p class="text-xs text-slate-500">Sharer</p>
      </div>
      <!-- Connection quality indicator -->
      <div v-if="hasStream" class="flex items-end gap-0.5 h-4">
        <span class="w-1 rounded-sm bg-emerald-500" style="height:40%" />
        <span class="w-1 rounded-sm bg-emerald-500" style="height:60%" />
        <span class="w-1 rounded-sm bg-emerald-500" style="height:100%" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { MonitorIcon, Maximize2Icon } from 'lucide-vue-next'

const props = defineProps<{
  username: string
  stream?: MediaStream
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const hasStream = computed(() => !!props.stream)

const initials = computed(() =>
  props.username
    .split(/[\s_]/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
)

// Bind stream to video element whenever stream or video element becomes available
watch(
  [() => props.stream, videoEl],
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

function toggleFullscreen() {
  if (!videoEl.value) return
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    videoEl.value.requestFullscreen()
  }
}
</script>
