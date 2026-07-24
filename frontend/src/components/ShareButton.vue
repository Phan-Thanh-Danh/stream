<template>
  <button
    @click="handleClick"
    :disabled="disabled"
    :class="[
      'relative flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-semibold',
      'transition-all duration-200 active:scale-95',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
      isSharing
        ? 'bg-red-500/90 text-white hover:bg-red-500 focus-visible:ring-red-500'
        : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer shadow-lg shadow-indigo-900/30'
    ]"
  >
    <!-- Animated pulse when sharing -->
    <span
      v-if="isSharing"
      class="absolute -top-1 -right-1 flex h-3 w-3"
    >
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span class="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
    </span>

    <component
      :is="isSharing ? MonitorOffIcon : MonitorIcon"
      class="h-5 w-5"
    />

    <span>{{ isSharing ? 'Stop Sharing' : 'Start Sharing' }}</span>
  </button>
</template>

<script setup lang="ts">
import { MonitorIcon, MonitorOffIcon } from 'lucide-vue-next'

const props = defineProps<{
  isSharing: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'toggle': []
}>()

function handleClick() {
  if (!props.disabled) emit('toggle')
}
</script>
