import { apiClient } from './client'
import type { LLMOptimizeRequest, LLMOptimizeResponse } from '@/types/api'

export async function optimizePrompt(
  params: LLMOptimizeRequest,
): Promise<LLMOptimizeResponse> {
  const { data } = await apiClient.post<LLMOptimizeResponse>(
    '/music/llm-optimize',
    params,
    { timeout: 60_000 },
  )
  return data
}