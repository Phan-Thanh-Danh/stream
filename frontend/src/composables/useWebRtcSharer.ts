import { ref } from 'vue'
import { useSignalR } from './useSignalR'
import { useStreamStore } from '@/stores/streamStore'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.metered.ca:80' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelay',
      credential: 'openrelay'
    }
  ],
  iceCandidatePoolSize: 10
}

export function useWebRtcSharer() {
  const { on, off, invoke } = useSignalR()
  const streamStore = useStreamStore()

  // Map of viewerConnectionId → RTCPeerConnection
  const peerConnections = new Map<string, RTCPeerConnection>()
  // Map of viewerConnectionId → pending candidates before remote description is set
  const pendingCandidates = new Map<string, RTCIceCandidateInit[]>()
  const error = ref<string | null>(null)
  const isSharing = ref(false)

  function createPeerConnection(viewerConnectionId: string): RTCPeerConnection {
    console.log(`[WebRTC Sharer] Creating peer connection for viewer (${viewerConnectionId})...`)
    const pc = new RTCPeerConnection(ICE_SERVERS)

    // Add all local tracks to the peer connection
    const stream = streamStore.localStream
    if (stream) {
      console.log('[WebRTC Sharer] Adding local tracks to peer connection:', stream.getTracks().map(t => t.kind))
      stream.getTracks().forEach(track => {
        track.enabled = true
        pc.addTrack(track, stream)
      })
    } else {
      console.warn('[WebRTC Sharer] WARNING: streamStore.localStream is NULL when creating peer connection!')
    }

    // Send ICE candidates to the viewer via SignalR
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('[WebRTC Sharer] Sending ICE candidate to viewer:', candidate.candidate)
        invoke('SendIceCandidate', viewerConnectionId, JSON.stringify(candidate))
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC Sharer] ICE connection state: ${pc.iceConnectionState}`)
    }

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Sharer] Peer connection state with viewer ${viewerConnectionId}: ${pc.connectionState}`)
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        pc.close()
        peerConnections.delete(viewerConnectionId)
        pendingCandidates.delete(viewerConnectionId)
      }
    }

    peerConnections.set(viewerConnectionId, pc)
    return pc
  }

  async function startSharing() {
    error.value = null
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 }
        },
        audio: false
      })

      // Enforce entire-screen sharing (optional, warn only)
      const track = stream.getVideoTracks()[0]
      const settings = track.getSettings() as MediaTrackSettings & { displaySurface?: string }
      if (settings.displaySurface && settings.displaySurface !== 'monitor') {
        console.warn('User chose window/tab instead of entire screen — consider warning them.')
      }

      // Stop sharing when user clicks browser's native "Stop sharing" button
      track.onended = () => {
        stopSharing()
      }

      streamStore.setLocalStream(stream)
      isSharing.value = true

      // Register hub handlers
      on('ReceiveOffer', handleReceiveOffer)
      on('ReceiveIceCandidate', handleReceiveIceCandidate)
      on('UserDisconnected', handleUserDisconnected)

      // Notify hub that we started sharing
      await invoke('StartSharing')
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        error.value = 'Screen share permission denied.'
      } else {
        error.value = err.message ?? 'Failed to start screen share.'
      }
    }
  }

  async function stopSharing() {
    isSharing.value = false
    streamStore.stopLocalStream()

    // Close all viewer peer connections
    peerConnections.forEach(pc => pc.close())
    peerConnections.clear()
    pendingCandidates.clear()

    // Remove hub handlers
    off('ReceiveOffer', handleReceiveOffer)
    off('ReceiveIceCandidate', handleReceiveIceCandidate)
    off('UserDisconnected', handleUserDisconnected)

    // Notify hub
    await invoke('StopSharing')
  }

  function handleUserDisconnected(_userId: number, _username: string, disconnectedConnectionId?: string) {
    if (disconnectedConnectionId && peerConnections.has(disconnectedConnectionId)) {
      console.log(`[WebRTC Sharer] Cleaning up disconnected peer connection (${disconnectedConnectionId})...`)
      peerConnections.get(disconnectedConnectionId)?.close()
      peerConnections.delete(disconnectedConnectionId)
      pendingCandidates.delete(disconnectedConnectionId)
    }
  }

  async function handleReceiveOffer(
    _viewerUserId: number,
    _viewerUsername: string,
    viewerConnectionId: string,
    sdpOffer: string
  ) {
    console.log(`[WebRTC Sharer] Received offer from viewer (${viewerConnectionId})...`)

    // Clean up existing peer connection for this viewer if present
    if (peerConnections.has(viewerConnectionId)) {
      peerConnections.get(viewerConnectionId)?.close()
      peerConnections.delete(viewerConnectionId)
      pendingCandidates.delete(viewerConnectionId)
    }

    const pc = createPeerConnection(viewerConnectionId)

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: sdpOffer }))

    // Apply queued ICE candidates from this viewer
    const pending = pendingCandidates.get(viewerConnectionId) || []
    for (const cand of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand))
      } catch (e) {
        console.error('Error adding pending ICE candidate on sharer:', e)
      }
    }
    pendingCandidates.delete(viewerConnectionId)

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    await invoke('SendAnswer', viewerConnectionId, answer.sdp)
  }

  async function handleReceiveIceCandidate(fromConnectionId: string, candidateJson: string) {
    const pc = peerConnections.get(fromConnectionId)
    const candidate = JSON.parse(candidateJson)

    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (e) {
        console.error('Error adding ICE candidate on sharer:', e)
      }
    } else {
      if (!pendingCandidates.has(fromConnectionId)) {
        pendingCandidates.set(fromConnectionId, [])
      }
      pendingCandidates.get(fromConnectionId)!.push(candidate)
    }
  }

  return { isSharing, error, startSharing, stopSharing }
}
