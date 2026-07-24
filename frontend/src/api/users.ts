import apiClient from './axios'
import type { UserDto } from '@/types'

export const usersApi = {
  getSharers: () => apiClient.get<UserDto[]>('/users')
}
