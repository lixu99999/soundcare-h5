import type { Scene, Instrument, Ambient } from '@/types/api'

const SCENE_NAMES: Record<Scene, string> = {
  sleep: '助眠',
  relax: '减压',
  focus: '专注',
  meditate: '冥想',
  study: '学习',
}

const INSTRUMENT_NAMES: Record<Instrument, string> = {
  piano: '钢琴',
  strings: '弦乐',
  pad: '合成器',
  nature: '自然音',
}

const AMBIENT_NAMES: Record<Ambient, string> = {
  none: '无',
  rain: '雨声',
  ocean: '海浪',
  forest: '森林',
}

export function getSceneName(scene: Scene): string {
  return SCENE_NAMES[scene] ?? scene
}

export function getInstrumentName(instrument: Instrument): string {
  return INSTRUMENT_NAMES[instrument] ?? instrument
}

export function getAmbientName(ambient: Ambient): string {
  return AMBIENT_NAMES[ambient] ?? ambient
}

// 简易场景匹配（LLM 失败 fallback 用）
export function matchSceneFromInput(input: string): Scene {
  const lower = input.toLowerCase()
  if (lower.includes('睡') || lower.includes('晚')) return 'sleep'
  if (lower.includes('累') || lower.includes('压力') || lower.includes('放松')) return 'relax'
  if (lower.includes('专注') || lower.includes('考试') || lower.includes('工作')) return 'focus'
  if (lower.includes('冥想')) return 'meditate'
  if (lower.includes('学习') || lower.includes('读书')) return 'study'
  return 'relax'
}

export const SCENE_DESCRIPTIONS: Record<Scene, string> = {
  sleep: 'sleep music, gentle lullaby, peaceful and calming',
  relax: 'relaxing music, stress relief, soothing atmosphere',
  focus: 'focus music, concentration, ambient study',
  meditate: 'meditation music, mindfulness, calming and centering',
  study: 'study music, light background, ambient learning',
}

// 中文 → 英文（用于构造 Suno prompt）
export function translateInstrumentToEnglish(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('钢琴')) return 'piano'
  if (lower.includes('弦乐')) return 'strings'
  if (lower.includes('电子') || lower.includes('pad')) return 'electronic pad synth'
  if (lower.includes('自然') || lower.includes('环境')) return 'nature sounds'
  if (lower.includes('吉他')) return 'guitar'
  if (lower.includes('竖琴')) return 'harp'
  return name
}

export function translateAmbientToEnglish(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('雨')) return 'rain'
  if (lower.includes('海') || lower.includes('浪')) return 'ocean waves'
  if (lower.includes('森林')) return 'forest'
  if (lower.includes('白噪音') || lower.includes('白噪声')) return 'white noise'
  if (lower.includes('鸟')) return 'birds singing'
  if (lower.includes('风')) return 'wind'
  if (lower.includes('雷')) return 'thunder'
  if (lower.includes('篝火') || lower.includes('火')) return 'campfire'
  if (lower.includes('咖')) return 'coffee shop ambience'
  return name
}

// 中文时间段 → API 时段枚举
export function timePeriodNameToValue(name: string): string {
  if (name.includes('晨间') || name.includes('唤醒')) return 'morning_wake'
  if (name.includes('上午') || name.includes('专注')) return 'morning_focus'
  if (name.includes('午间') || name.includes('午休')) return 'noon_break'
  if (name.includes('下午') || name.includes('专注')) return 'afternoon_focus'
  if (name.includes('晚间') || name.includes('放松')) return 'evening_relax'
  if (name.includes('睡前') || name.includes('睡眠') || name.includes('助眠')) return 'sleep'
  return 'evening_relax'
}

// 简易 toast（MVP 直接用 console + alert；后续可加 <Teleport> 组件）
export function showToast(title: string): void {
  console.log(`[Toast] ${title}`)
  if (typeof window !== 'undefined') {
    alert(title)
  }
}