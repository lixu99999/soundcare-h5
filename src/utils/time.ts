import type { TimePeriod } from '@/types/api'

export function getTimePeriodName(hour: number): string {
  if (hour >= 6 && hour < 8) return '晨间唤醒'
  if (hour >= 8 && hour < 12) return '上午专注'
  if (hour >= 12 && hour < 14) return '午间休整'
  if (hour >= 14 && hour < 18) return '下午专注'
  if (hour >= 18 && hour < 22) return '晚间放松'
  return '睡前助眠'
}

export function getGreeting(hour: number): string {
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

export function getTimePeriodValue(): TimePeriod {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 8) return 'morning_wake'
  if (hour >= 8 && hour < 12) return 'morning_focus'
  if (hour >= 12 && hour < 14) return 'noon_break'
  if (hour >= 14 && hour < 18) return 'afternoon_focus'
  if (hour >= 18 && hour < 22) return 'evening_relax'
  return 'sleep'
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}