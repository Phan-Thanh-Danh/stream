import { ref, onUnmounted } from 'vue'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '@/stores/authStore'

const HUB_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api')
  .replace('/api', '') + '/hubs/stream'

let connection: signalR.HubConnection | null = null
const isConnected = ref(false)

const reconnectedCallbacks = new Set<() => void>()

let connectingPromise: Promise<void> | null = null

export function useSignalR() {
  const authStore = useAuthStore()

  async function connect() {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      isConnected.value = true
      return
    }

    if (connectingPromise) {
      await connectingPromise
      return
    }

    connectingPromise = (async () => {
      try {
        if (!connection || connection.state === signalR.HubConnectionState.Disconnected) {
          connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
              accessTokenFactory: () => authStore.token ?? '',
              transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build()

          connection.onclose(() => { isConnected.value = false })
          connection.onreconnecting(() => { isConnected.value = false })
          connection.onreconnected(() => {
            isConnected.value = true
            reconnectedCallbacks.forEach(cb => cb())
          })

          // Register default no-op handlers to prevent "No client method with name found" warnings
          const defaultEvents = ['ActiveSharings', 'UserJoined', 'UserDisconnected', 'SharerStarted', 'SharerStopped', 'SharingUserDisconnected']
          defaultEvents.forEach(evt => {
            connection!.on(evt, () => {})
          })
        }

        if (connection.state === signalR.HubConnectionState.Disconnected) {
          await connection.start()
        }
        isConnected.value = true
      } finally {
        connectingPromise = null
      }
    })()

    await connectingPromise
  }

  async function disconnect() {
    await connection?.stop()
    isConnected.value = false
  }

  function on(event: string, callback: (...args: any[]) => void) {
    connection?.on(event, callback)
  }

  function off(event: string, callback: (...args: any[]) => void) {
    connection?.off(event, callback)
  }

  function onReconnected(cb: () => void) {
    reconnectedCallbacks.add(cb)
    onUnmounted(() => {
      reconnectedCallbacks.delete(cb)
    })
  }

  async function invoke(method: string, ...args: any[]) {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return
    return connection.invoke(method, ...args)
  }

  function getConnectionId() {
    return connection?.connectionId ?? null
  }

  return { isConnected, connect, disconnect, on, off, onReconnected, invoke, getConnectionId }
}
