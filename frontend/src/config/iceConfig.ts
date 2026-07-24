/**
 * Fetches ICE server configuration (STUN/TURN) from the backend.
 * Credentials are never hardcoded in the frontend — always fetched from the server.
 *
 * Falls back to a basic STUN-only config if the request fails.
 */

const FALLBACK_ICE: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  iceCandidatePoolSize: 5,
}

let _cachedConfig: RTCConfiguration | null = null

export async function fetchIceConfig(): Promise<RTCConfiguration> {
  if (_cachedConfig) return _cachedConfig

  try {
    const baseUrl = import.meta.env.VITE_API_URL ?? 'https://localhost:5001/api'
    // Remove trailing /api if present, we'll add the path manually
    const origin = baseUrl.replace(/\/api\/?$/, '')
    const res = await fetch(`${origin}/api/IceConfig`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) throw new Error(`ICE config fetch failed: ${res.status}`)

    const data = await res.json()
    _cachedConfig = {
      iceServers: data.iceServers,
      iceCandidatePoolSize: 5,
    }
    console.log('[ICE Config] Loaded from server:', _cachedConfig)
    return _cachedConfig
  } catch (err) {
    console.warn('[ICE Config] Failed to fetch from server, using fallback STUN only:', err)
    return FALLBACK_ICE
  }
}
