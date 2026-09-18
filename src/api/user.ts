import { apiClient } from './client'
import type { UserResponse, UserPreferences } from '@/types/api'

export async function getUser(userId: string): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>(`/user/${userId}`)
  return data
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<UserResponse> {
  const { data } = await apiClient.put<UserResponse>(
    `/user/${userId}/preferences`,
    preferences,
  )
  return data
}