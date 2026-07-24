<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4">
    <!-- Background grid -->
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:48px_48px]" />

    <!-- Glow -->
    <div class="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2
                rounded-full bg-indigo-700/10 blur-[120px]" />

    <!-- Card -->
    <div class="relative w-full max-w-md rounded-3xl border border-white/8 bg-slate-900/80 p-8 shadow-2xl
                shadow-black/60 backdrop-blur-xl">
      <!-- Logo -->
      <div class="mb-8 flex flex-col items-center gap-3">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-indigo-900/40">
          <MonitorIcon class="h-7 w-7 text-white" />
        </div>
        <div class="text-center">
          <h1 class="text-xl font-bold text-white">ScreenShare</h1>
          <p class="mt-1 text-sm text-slate-500">Real-time screen monitoring</p>
        </div>
      </div>

      <!-- Error alert -->
      <Transition name="slide-down">
        <div
          v-if="errorMessage"
          class="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
        >
          <AlertCircleIcon class="h-4 w-4 shrink-0 text-red-400" />
          <p class="text-sm text-red-400">{{ errorMessage }}</p>
        </div>
      </Transition>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Username -->
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-400">Username</label>
          <div class="relative">
            <UserIcon class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              v-model="form.username"
              type="text"
              placeholder="Enter username"
              autocomplete="username"
              required
              class="w-full rounded-xl border border-white/8 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-white
                     placeholder-slate-600 transition-all outline-none
                     focus:border-indigo-500/60 focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-400">Password</label>
          <div class="relative">
            <LockIcon class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter password"
              autocomplete="current-password"
              required
              class="w-full rounded-xl border border-white/8 bg-slate-800/60 py-3 pl-10 pr-11 text-sm text-white
                     placeholder-slate-600 transition-all outline-none
                     focus:border-indigo-500/60 focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <component :is="showPassword ? EyeOffIcon : EyeIcon" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white
                 shadow-lg shadow-indigo-900/30 transition-all
                 hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in…
          </span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <!-- Demo hint -->
      <div class="mt-6 rounded-xl border border-white/5 bg-slate-800/40 p-4">
        <p class="mb-2 text-xs font-medium text-slate-500">Demo accounts (password: <code class="text-indigo-400">password123</code>)</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="demo in demoAccounts"
            :key="demo.username"
            @click="fillDemo(demo)"
            class="rounded-lg border border-white/5 bg-slate-800 px-3 py-2 text-left text-xs transition-all
                   hover:border-indigo-500/30 hover:bg-slate-700"
          >
            <span class="block font-medium text-slate-200">{{ demo.username }}</span>
            <span :class="demo.role === 'Sharer' ? 'text-indigo-400' : 'text-emerald-400'" class="text-[10px]">{{ demo.role }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MonitorIcon, UserIcon, LockIcon, AlertCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const demoAccounts = [
  { username: 'sharer1', role: 'Sharer' },
  { username: 'sharer2', role: 'Sharer' },
  { username: 'viewer1', role: 'Viewer' },
  { username: 'viewer2', role: 'Viewer' }
]

function fillDemo(demo: { username: string }) {
  form.username = demo.username
  form.password = 'password123'
}

async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await authStore.login({ username: form.username, password: form.password })
    const target = authStore.isSharer ? '/sharer' : '/viewer'
    await router.push(target)
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message ?? 'Login failed. Check credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
