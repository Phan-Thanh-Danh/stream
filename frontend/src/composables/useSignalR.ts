import { ref, onUnmounted } from 'vue'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '@/stores/authStore'

const HUB_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api')
  .replace('/api', '') + '/hubs/stream'

let connection: signalR.HubConnection | null = null
const isConnected = ref(false)

export function useSignalR() {
  const authStore = useAuthStore()

  async function connect() {
    if (connection && connection.state === signalR.HubConnectionState.Connected) return

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
    connection.onreconnected(() => { isConnected.value = true })

    // Register default no-op handlers to prevent "No client method with name found" warnings
    const defaultEvents = ['ActiveSharings', 'UserJoined', 'UserDisconnected', 'SharerStarted', 'SharerStopped', 'SharingUserDisconnected']
    defaultEvents.forEach(evt => {
      connection!.on(evt, () => {})
    })

    await connection.start()
    isConnected.value = true
    // NOTE: Do NOT call Join() here.
    // Each view must call invoke('Join') AFTER registering its own hub handlers.
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

  async function invoke(method: string, ...args: any[]) {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return
    return connection.invoke(method, ...args)
  }

  function getConnectionId() {
    return connection?.connectionId ?? null
  }

  return { isConnected, connect, disconnect, on, off, invoke, getConnectionId }
}
