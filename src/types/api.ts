// 后端 schema 的 TS 镜像（参考 soundcare-backend/app/schemas/schemas.py）

export type TimePeriod =
  | 'morning_wake'
  | 'morning_focus'
  | 'noon_break'
  | 'afternoon_focus'
  | 'evening_relax'
  | 'sleep'

export type Scene = 'sleep' | 'relax' | 'focus' | 'meditate' | 'study'

export type HRVStatus = 'relaxed' | 'normal' | 'stressed' | 'anxious'

export type Instrument = 'piano' | 'strings' | 'pad' | 'nature'
export type Ambient = 'none' | 'rain' | 'ocean' | 'forest'

export interface HRVData {
  rmssd: number
  heart_rate: number
  sdnn?: number
  pnn50?: number
  rri_data?: number[]
  timestamp?: string
}

export interface MusicParameters {
  bpm: number
  key: string
  instrument: Instrument
  ambient: Ambient
  mix_ratio?: number
}

export interface HRVAdjustment {
  target_bpm_reduction: number
  suggested_mood: 'relaxing' | 'calming' | 'energizing'
  focus_low_freq: boolean
}

export interface MusicGenerateRequest {
  user_id?: string
  time_period: TimePeriod
  hrv_data?: HRVData
  hrv_status?: HRVStatus
  scene?: Scene
  preferences?: MusicParameters
  duration_minutes?: number
  provider?: 'minimax' | 'suno'
  optimized_prompt?: string
}

export interface MusicGenerateResponse {
  session_id: string
  music_url: string
  duration?: number
  music_title?: string
  cover_image_url?: string
  parameters: MusicParameters
  hrv_adjustment: HRVAdjustment
  healing_metrics: Record<string, any>
}

export interface HRVUpdateRequest {
  rmssd: number
  heart_rate: number
  elapsed_seconds: number
  device_type: 'apple_watch' | 'huawei_watch' | 'polar'
  sdnn?: number
  pnn50?: number
  rri_data?: number[]
}

export interface HRVUpdateResponse {
  adjustment: Record<string, any>
  session_metrics: Record<string, any>
}

export interface HealingSession {
  id: string
  time_period: TimePeriod
  scene?: Scene
  duration_minutes: number
  parameters: Record<string, any>
  healing_score?: number
  hrv_improve_percent?: number
  created_at: string
}

export interface LLMOptimizeRequest {
  user_input: string
  time_period: TimePeriod
  hrv_status?: HRVStatus
}

export interface LLMOptimizeResponse {
  scene: Scene
  optimized_prompt: string
  parameters: MusicParameters
  explanation: string
}

export interface UserPreferences {
  instrument: Instrument
  ambient: Ambient
  mix_ratio: number
  wake_time: string
  sleep_time: string
}

export interface UserResponse {
  id: string
  nickname: string | null
  preferences: Record<string, any>
  sleep_time: string | null
  wake_time: string | null
  created_at: string
}