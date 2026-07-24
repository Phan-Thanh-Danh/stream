import { useSignalR } from './useSignalR'
import { useStreamStore } from '@/stores/streamStore'
import type { SharerSession } from '@/types'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
}

export function useWebRtcViewer() {
  const { on, off, invoke } = useSignalR()
  const streamStore = useStreamStore()

  function registerHubHandlers() {
    on('SharerStarted', handleSharerStarted)
    on('SharerStopped', handleSharerStopped)
    on('SharingUserDisconnected', handleSharerStopped)
    on('ActiveSharings', handleActiveSharings)
    on('ReceiveAnswer', handleReceiveAnswer)
    on('ReceiveIceCandidate', handleReceiveIceCandidate)
  }

  function unregisterHubHandlers() {
    off('SharerStarted', handleSharerStarted)
    off('SharerStopped', handleSharerStopped)
    off('SharingUserDisconnected', handleSharerStopped)
    off('ActiveSharings', handleActiveSharings)
    off('ReceiveAnswer', handleReceiveAnswer)
    off('ReceiveIceCandidate', handleReceiveIceCandidate)
  }

  const pendingCandidates = new Map<string, RTCIceCandidateInit[]>()

  async function connectToSharer(sharerUserId: number, sharerUsername: string, sharerConnectionId: string) {
    console.log(`[WebRTC Viewer] Connecting to sharer ${sharerUsername} (${sharerConnectionId})...`)
    const pc = new RTCPeerConnection(ICE_SERVERS)

    const session: SharerSession = {
      userId: sharerUserId,
      username: sharerUsername,
      connectionId: sharerConnectionId,
      peerConnection: pc
    }

    streamStore.addSession(session)

    // When we receive the remote stream tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC Viewer] Received remote track:', event.track.kind, event.streams)
      const remoteStream = event.streams[0] || new MediaStream([event.track])
      streamStore.updateSessionStream(sharerUserId, remoteStream)
    }

    // Send ICE candidates to the Sharer
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('[WebRTC Viewer] Sending ICE candidate to sharer:', candidate.candidate)
        invoke('SendIceCandidate', sharerConnectionId, JSON.stringify(candidate))
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC Viewer] ICE connection state: ${pc.iceConnectionState}`)
    }

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Viewer] Peer connection state with ${sharerUsername}: ${pc.connectionState}`)
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        streamStore.removeSession(sharerUserId)
        pendingCandidates.delete(sharerConnectionId)
      }
    }

    // Create and send offer
    console.log('[WebRTC Viewer] Creating SDP Offer...')
    const offer = await pc.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: false
    })
    await pc.setLocalDescription(offer)
    console.log('[WebRTC Viewer] Sending SDP Offer to sharer...')
    await invoke('SendOffer', sharerConnectionId, offer.sdp)
  }

  // ── Hub Event Handlers ───────────────────────────────────────────────────

  async function handleSharerStarted(userId: number, username: string, connectionId: string) {
    console.log('[WebRTC Viewer] SharerStarted event received:', userId, username, connectionId)
    await connectToSharer(userId, username, connectionId)
  }

  function handleSharerStopped(userId: number) {
    console.log('[WebRTC Viewer] SharerStopped event received for userId:', userId)
    streamStore.removeSession(userId)
  }

  async function handleActiveSharings(sharings: { userId: number; username: string; connectionId?: string }[]) {
    console.log('[WebRTC Viewer] ActiveSharings received:', sharings)
    for (const s of sharings) {
      if (s.connectionId) {
        await connectToSharer(s.userId, s.username, s.connectionId)
      }
    }
  }

  async function handleReceiveAnswer(sharerConnectionId: string, sdpAnswer: string) {
    console.log('[WebRTC Viewer] Received SDP Answer from sharer:', sharerConnectionId)
    const session = [...streamStore.activeSessions.values()]
      .find(s => s.connectionId === sharerConnectionId)

    if (session?.peerConnection) {
      const pc = session.peerConnection
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: sdpAnswer })
      )
      console.log('[WebRTC Viewer] Remote description (Answer) set successfully.')

      // Apply queued ICE candidates
      const pending = pendingCandidates.get(sharerConnectionId) || []
      console.log(`[WebRTC Viewer] Applying ${pending.length} pending ICE candidates...`)
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
          console.error('[WebRTC Viewer] Error adding pending ICE candidate:', e)
        }
      }
      pendingCandidates.delete(sharerConnectionId)
    }
  }

  async function handleReceiveIceCandidate(fromConnectionId: string, candidateJson: string) {
    const session = [...streamStore.activeSessions.values()]
      .find(s => s.connectionId === fromConnectionId)

    const candidate = JSON.parse(candidateJson)

    if (session?.peerConnection) {
      const pc = session.peerConnection
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
          console.log('[WebRTC Viewer] Added ICE candidate from sharer.')
        } catch (e) {
          console.error('[WebRTC Viewer] Error adding ICE candidate:', e)
        }
      } else {
        console.log('[WebRTC Viewer] Remote description not set yet, queueing ICE candidate.')
        if (!pendingCandidates.has(fromConnectionId)) {
          pendingCandidates.set(fromConnectionId, [])
        }
        pendingCandidates.get(fromConnectionId)!.push(candidate)
      }
    }
  }

  return { registerHubHandlers, unregisterHubHandlers }
}
