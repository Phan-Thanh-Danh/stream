import { useSignalR } from './useSignalR'
import { useStreamStore } from '@/stores/streamStore'
import type { SharerSession } from '@/types'
import { fetchIceConfig } from '@/config/iceConfig'

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

    // Clean up any stale session for this sharer before re-connecting
    streamStore.removeSession(sharerUserId)
    pendingCandidates.delete(sharerConnectionId)

    const iceConfig = await fetchIceConfig()
    const pc = new RTCPeerConnection(iceConfig)
    pc.addTransceiver('video', { direction: 'recvonly' })

    const session: SharerSession = {
      userId: sharerUserId,
      username: sharerUsername,
      connectionId: sharerConnectionId,
      peerConnection: pc
    }

    streamStore.addSession(session)

    // When we receive the remote stream tracks
    pc.ontrack = (event) => {
      const track = event.track
      track.enabled = true
      console.log('[WebRTC Viewer] Received remote track:', track.kind, 'muted:', track.muted, 'readyState:', track.readyState)

      const publishStream = () => {
        const stream = new MediaStream([track])
        streamStore.updateSessionStream(sharerUserId, stream)
      }

      // FIX 2: Only publish when track is actually live (not muted).
      // Publishing a muted track causes a permanent black screen.
      track.onunmute = () => {
        console.log('[WebRTC Viewer] Track unmuted! Publishing stream...')
        publishStream()
      }

      if (!track.muted) {
        publishStream()
      }
    }

    // Send ICE candidates to the Sharer
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('[WebRTC Viewer] Sending ICE candidate to sharer:', candidate.candidate)
        invoke('SendIceCandidate', sharerConnectionId, JSON.stringify(candidate))
      }
    }

    // FIX 3: Replace broken ICE-restart logic with a clean full reconnect.
    // ICE restart on a failed connection is unreliable; tearing down and
    // re-creating the PeerConnection from scratch is more robust.
    pc.oniceconnectionstatechange = async () => {
      console.log(`[WebRTC Viewer] ICE connection state: ${pc.iceConnectionState}`)
      if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC Viewer] ICE failed — performing full reconnect...')
        streamStore.removeSession(sharerUserId)
        pendingCandidates.delete(sharerConnectionId)
        await connectToSharer(sharerUserId, sharerUsername, sharerConnectionId)
      }
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
