import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SharerSession } from '@/types'

export const useStreamStore = defineStore('stream', () => {
  // --- Sharer state ---
  const isSharing = ref(false)
  const localStream = ref<MediaStream | null>(null)

  // --- Viewer state: map of userId → SharerSession ---
  const activeSessions = ref<Map<number, SharerSession>>(new Map())

  // Sharer actions
  function setLocalStream(stream: MediaStream | null) {
    localStream.value = stream
    isSharing.value = !!stream
  }

  function stopLocalStream() {
    localStream.value?.getTracks().forEach(t => t.stop())
    localStream.value = null
    isSharing.value = false
  }

  // Viewer actions
  function addSession(session: SharerSession) {
    activeSessions.value.set(session.userId, session)
    activeSessions.value = new Map(activeSessions.value)
  }

  function updateSessionStream(userId: number, stream: MediaStream) {
    const session = activeSessions.value.get(userId)
    if (session) {
      session.stream = stream
      activeSessions.value = new Map(activeSessions.value)
    }
  }

  function removeSession(userId: number) {
    const session = activeSessions.value.get(userId)
    if (session) {
      session.peerConnection?.close()
      activeSessions.value.delete(userId)
      activeSessions.value = new Map(activeSessions.value)
    }
  }

  function clearSessions() {
    activeSessions.value.forEach(s => s.peerConnection?.close())
    activeSessions.value.clear()
    activeSessions.value = new Map()
  }

  return {
    isSharing,
    localStream,
    activeSessions,
    setLocalStream,
    stopLocalStream,
    addSession,
    updateSessionStream,
    removeSession,
    clearSessions
  }
})
