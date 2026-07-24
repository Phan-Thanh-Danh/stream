export type UserRole = 'Sharer' | 'Viewer'

export interface AuthUser {
  userId: number
  username: string
  role: UserRole
  token: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  username: string
  role: UserRole
  userId: number
}

export interface UserDto {
  id: number
  username: string
  role: UserRole
}

// Active sharing session tracked in Viewer dashboard
export interface SharerSession {
  userId: number
  username: string
  connectionId: string
  stream?: MediaStream
  peerConnection?: RTCPeerConnection
}
