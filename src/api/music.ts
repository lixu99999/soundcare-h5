import { apiClient } from './client'
import type {
  MusicGenerateRequest,
  MusicGenerateResponse,
  HRVUpdateRequest,
  HRVUpdateResponse,
  HealingSession,
} from '@/types/api'

export async function generateMusic(
  params: MusicGenerateRequest,
): Promise<MusicGenerateResponse> {
  const { data } = await apiClient.post<MusicGenerateResponse>(
    '/music/generate',
    params,
    { timeout: 180_000 }, // 3 分钟 — 单次音乐生成超时
  )
  return data
}

export async function updateHRV(
  sessionId: string,
  hrvData: HRVUpdateRequest,
): Promise<HRVUpdateResponse> {
  const { data } = await apiClient.post<HRVUpdateResponse>(
    `/music/session/${sessionId}/hrv-update`,
    hrvData,
  )
  return data
}

export async function getUserSessions(
  userId: string,
): Promise<HealingSession[]> {
  const { data } = await apiClient.get<HealingSession[]>(
    `/music/sessions/${userId}`,
  )
  return data
}