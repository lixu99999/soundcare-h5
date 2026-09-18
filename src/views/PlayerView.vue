<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '@/stores/music'
import { useHrvStore } from '@/stores/hrv'
import { formatTime } from '@/utils/time'
import { showToast } from '@/utils/translate'
import { userStorage } from '@/utils/storage'
import type { HRVUpdateRequest } from '@/types/api'

const musicStore = useMusicStore()
const hrvStore = useHrvStore()

const musicUrl = ref('')
const musicTitle = ref('疗愈音乐')
const coverImageUrl = ref('')
const sessionDuration = ref(15)

const currentHRV = ref(52)
const hrvStatus = ref('正常放松')
const hrvTrend = ref('稳定')
const healingProgress = ref(0)

const elapsedSeconds = ref(0)
const isPlaying = ref(false)
const actualDuration = ref(0)

const hrvHistory = ref<number[]>([])
const healingScore = ref(0)
const hrvImprove = ref('0%')
const rhythmSync = ref(0)
const relaxInduction = ref(0)

const hrvLoopEnabled = ref(true)

let audioElement: HTMLAudioElement | null = null
let hrvUpdateTimer: ReturnType<typeof setInterval> | null = null
let musicRegenerateTimer: ReturnType<typeof setInterval> | null = null

// Player 专用 HRV 计算器（比通用版多 trend/level/heartrate 估算等）
class PlayerHRV {
  windowSize = 30_000
  rriBuffer: Array<{ value: number; timestamp: number }> = []
  heartRateBuffer: Array<{ value: number; timestamp: number }> = []

  addRRI(rriMs: number) {
    this.rriBuffer.push({ value: rriMs, timestamp: Date.now() })
    this.cleanOldData()
  }
  addHeartRate(bpm: number) {
    this.heartRateBuffer.push({ value: bpm, timestamp: Date.now() })
    this.cleanOldData()
  }
  private cleanOldData() {
    const cutoff = Date.now() - this.windowSize
    this.rriBuffer = this.rriBuffer.filter((d) => d.timestamp > cutoff)
    this.heartRateBuffer = this.heartRateBuffer.filter((d) => d.timestamp > cutoff)
  }
  calculateRMSSD(): number | null {
    if (this.rriBuffer.length < 2) return null
    const v = this.rriBuffer.map((d) => d.value)
    let sum = 0
    for (let i = 0; i < v.length - 1; i++) sum += (v[i + 1] - v[i]) ** 2
    return Math.sqrt(sum / (v.length - 1))
  }
  estimateStatusFromHeartRate(): { status: string; level: number } | null {
    if (this.heartRateBuffer.length < 10) return null
    const rates = this.heartRateBuffer.map((d) => d.value)
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length
    const variance = rates.reduce((s, r) => s + (r - avg) ** 2, 0) / rates.length
    const std = Math.sqrt(variance)
    const cv = std / avg
    if (avg > 90) return { status: '焦虑', level: 5 }
    if (avg > 80) return { status: '压力大', level: 4 }
    if (avg > 70 && cv < 0.01) return { status: '紧张', level: 3 }
    if (avg < 65 && cv > 0.02) return { status: '深度放松', level: 1 }
    if (avg < 75) return { status: '正常放松', level: 2 }
    return { status: '正常', level: 2 }
  }
  getStatusDesc(): string {
    const rmssd = this.calculateRMSSD()
    if (rmssd !== null) {
      if (rmssd > 80) return '深度放松'
      if (rmssd > 50) return '正常放松'
      if (rmssd > 30) return '中度压力'
      return '高压力'
    }
    return this.estimateStatusFromHeartRate()?.status ?? '数据不足'
  }
  getRMSSD() {
    return this.calculateRMSSD()
  }
  getTrend(history: number[]): string {
    if (history.length < 5) return '数据积累中'
    const recent = history.slice(-5)
    const first = recent[0]
    const last = recent[recent.length - 1]
    if (last > first + 5) return '↑ 改善中'
    if (last < first - 5) return '↓ 加深'
    return '→ 稳定'
  }
  getStatusLevel(): number {
    const rmssd = this.calculateRMSSD()
    if (rmssd !== null) {
      if (rmssd > 80) return 1
      if (rmssd > 50) return 2
      if (rmssd > 30) return 3
      if (rmssd > 15) return 4
      return 5
    }
    return this.estimateStatusFromHeartRate()?.level ?? 3
  }
}

const hrvCalc = new PlayerHRV()
const initialHRV = 40

function generateSimulatedRRI(targetHRV: number, heartRateBPM: number): number[] {
  const interval = 60000 / heartRateBPM
  const variation = targetHRV / 2
  const count = 5 + Math.floor(Math.random() * 4)
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    const noise = (Math.random() - 0.5) * variation
    const rri = interval + noise + (Math.random() - 0.5) * variation * 0.5
    out.push(Math.round(rri))
  }
  return out
}

const updateHRV = (): void => {
  if (!hrvLoopEnabled.value) return

  const simulatedHR = 65 + Math.floor(Math.random() * 15)
  hrvStore.heartRate = simulatedHR

  const rriBatch = generateSimulatedRRI(currentHRV.value, simulatedHR)
  rriBatch.forEach((r) => hrvCalc.addRRI(r))
  hrvCalc.addHeartRate(simulatedHR)

  const rmssd = hrvCalc.getRMSSD()
  if (rmssd !== null && rmssd > 0) {
    currentHRV.value = Math.round(rmssd)
    hrvStore.rmssd = currentHRV.value
  } else {
    const est = hrvCalc.estimateStatusFromHeartRate()
    if (est) currentHRV.value = 30 + Math.round(est.level * 10)
  }

  hrvStatus.value = hrvCalc.getStatusDesc()
  hrvStore.hrvStatus = hrvStatus.value
  hrvTrend.value = hrvCalc.getTrend(hrvHistory.value)

  hrvHistory.value.push(currentHRV.value)
  if (hrvHistory.value.length > 60) hrvHistory.value.shift()
  hrvStore.record()

  const improvement = Math.round((currentHRV.value - initialHRV) / initialHRV * 100)
  hrvImprove.value = `${improvement >= 0 ? '+' : ''}${improvement}%`
  healingProgress.value = Math.min(100, Math.max(0, 50 + improvement))

  if (currentHRV.value > 50) {
    healingScore.value = Math.min(100, 60 + currentHRV.value - 50)
    rhythmSync.value = Math.min(100, 70 + (currentHRV.value - 40) / 2)
    relaxInduction.value = Math.min(100, 65 + (currentHRV.value - 45) / 3)
  }

  console.log('HRV 更新:', { rmssd: currentHRV.value, heartRate: simulatedHR, status: hrvStatus.value, trend: hrvTrend.value })
}

const syncHRVToBackend = async (): Promise<void> => {
  if (!hrvLoopEnabled.value) return
  // 调用后端的 /music/session/{session_id}/hrv-update — MVP 只打日志
  const payload: HRVUpdateRequest = {
    rmssd: currentHRV.value,
    heart_rate: hrvStore.heartRate,
    elapsed_seconds: elapsedSeconds.value,
    device_type: 'simulated' as unknown as HRVUpdateRequest['device_type'],
  }
  console.log('HRV 同步后端:', payload, 'user:', userStorage.get())
  // TODO: 等 utils 引入 updateHRV 后正式调用
}

const togglePlay = (): void => {
  if (!audioElement) return
  if (isPlaying.value) {
    audioElement.pause()
    isPlaying.value = false
  } else {
    if (elapsedSeconds.value >= actualDuration.value - 1) {
      audioElement.currentTime = 0
      elapsedSeconds.value = 0
    }
    audioElement.play().catch((e) => console.warn('autoplay blocked:', e))
    isPlaying.value = true
  }
}

const onSliderChange = (e: Event): void => {
  const targetTime = Number((e.target as HTMLInputElement).value)
  if (audioElement) {
    audioElement.currentTime = targetTime
    elapsedSeconds.value = targetTime
  }
}

const restartTrack = (): void => {
  if (!audioElement) return
  audioElement.currentTime = 0
  elapsedSeconds.value = 0
  audioElement.play().catch((e) => console.warn('autoplay blocked:', e))
  isPlaying.value = true
}

const nextTrack = (): void => {
  restartTrack()
}

const initAudio = (): void => {
  if (!musicUrl.value) return

  audioElement = new Audio(musicUrl.value)
  audioElement.preload = 'auto'

  audioElement.addEventListener('canplay', () => {
    if (actualDuration.value <= 0 && audioElement) {
      actualDuration.value = Math.floor(audioElement.duration) || 0
      sessionDuration.value = Math.floor(actualDuration.value / 60) || 15
    }
  })
  audioElement.addEventListener('play', () => {
    isPlaying.value = true
  })
  audioElement.addEventListener('timeupdate', () => {
    if (audioElement) elapsedSeconds.value = Math.floor(audioElement.currentTime)
  })
  audioElement.addEventListener('ended', () => {
    isPlaying.value = false
    elapsedSeconds.value = 0
  })
  audioElement.addEventListener('error', (e) => {
    console.error('音频播放错误:', e)
    showToast('播放失败')
  })

  audioElement.play().catch((e) => console.warn('autoplay blocked:', e))
}

onMounted(() => {
  // 从 musicStore 读取（storage 已在 store.set() 时持久化）
  const cached = musicStore.load()
  if (cached) {
    musicUrl.value = cached.url
    musicTitle.value = cached.title
    coverImageUrl.value = cached.cover
    actualDuration.value = cached.duration
    sessionDuration.value = Math.floor(cached.duration / 60) || 15
    musicStore.clear() // 读后即清 — 与原小程序行为一致（防止下次启动误播）
  }

  hrvHistory.value = [initialHRV]
  currentHRV.value = initialHRV
  hrvStore.reset()

  initAudio()

  hrvUpdateTimer = setInterval(updateHRV, 5000)
  musicRegenerateTimer = setInterval(syncHRVToBackend, 120_000)
})

onUnmounted(() => {
  if (audioElement) {
    audioElement.pause()
    audioElement.src = ''
    audioElement = null
  }
  if (hrvUpdateTimer) clearInterval(hrvUpdateTimer)
  if (musicRegenerateTimer) clearInterval(musicRegenerateTimer)
})

// 曲线绘制
const CURVE_WIDTH = 560 // 与 rpx 设计稿宽度同步
const CURVE_HEIGHT = 120
const MAX_HRV = 80
const MIN_HRV = 20

const getHRVCurveDots = (): Array<{ x: number; y: number }> => {
  const points = hrvHistory.value.slice(-20)
  if (points.length === 0) return []
  return points.map((value, index) => {
    const x = Math.round((index / (points.length - 1 || 1)) * CURVE_WIDTH)
    const yRatio = Math.max(0, Math.min(1, (value - MIN_HRV) / (MAX_HRV - MIN_HRV)))
    const y = Math.round(CURVE_HEIGHT * (1 - yRatio))
    return { x, y }
  })
}

const getCurveWidth = (): string => {
  const points = hrvHistory.value.slice(-20)
  if (points.length < 2) return '0'
  const stepX = CURVE_WIDTH / (points.length - 1)
  return `${Math.round(stepX * (points.length - 1))}px`
}

const getCurrentHRVPoint = (): { cx: number; cy: number } => {
  const dots = getHRVCurveDots()
  if (dots.length === 0) return { cx: 0, cy: 60 }
  const last = dots[dots.length - 1]
  return { cx: last.x, cy: last.y }
}

const HRV_BADGE_MAP: Record<string, string> = {
  深度放松: 'relaxed',
  正常放松: 'normal',
  中度压力: 'stressed',
  高压力: 'high-stress',
}
const getHRVBadgeClass = (): string => HRV_BADGE_MAP[hrvStatus.value] || 'normal'
</script>

<template>
  <div class="container">
    <header class="header">
      <h1 class="music-title">{{ musicTitle }}</h1>
    </header>

    <section class="player-section">
      <div class="vinyl-container">
        <div class="vinyl" :class="{ playing: isPlaying }">
          <div class="vinyl-label">
            <img v-if="coverImageUrl" class="cover-img" :src="coverImageUrl" alt="cover" />
            <span v-else class="music-note">♫</span>
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="time-display">
          <span class="time-current">{{ formatTime(elapsedSeconds) }}</span>
          <span class="time-separator">/</span>
          <span class="time-total">{{ formatTime(actualDuration) }}</span>
        </div>
        <input
          type="range"
          class="progress-slider"
          :value="elapsedSeconds"
          :min="0"
          :max="actualDuration || 1"
          @input="onSliderChange"
        />
        <div class="play-buttons">
          <button class="btn-control" @click="restartTrack">
            <span class="icon">⏮️</span>
          </button>
          <button class="btn-play" @click="togglePlay">
            <span class="icon">{{ isPlaying ? '⏸️' : '▶️' }}</span>
          </button>
          <button class="btn-control" @click="nextTrack">
            <span class="icon">⏭️</span>
          </button>
        </div>
      </div>
    </section>

    <section class="hrv-curve-card">
      <h2 class="curve-title">🌡️ HRV 引导曲线</h2>
      <div class="curve-container">
        <div class="hrv-curve-wrapper">
          <div class="hrv-curve">
            <span
              v-for="(point, index) in getHRVCurveDots()"
              :key="index"
              class="curve-dot"
              :style="{
                left: point.x + 'px',
                bottom: point.y + 'px',
                backgroundColor: index === getHRVCurveDots().length - 1 ? '#FF6B00' : '#FF8C42',
              }"
            ></span>
            <span class="curve-line" :style="{ width: getCurveWidth() }"></span>
          </div>
        </div>
      </div>
      <div class="curve-legend">
        <span class="legend-item">初始: 32ms</span>
        <span class="legend-item">→ 当前: {{ currentHRV }}ms</span>
        <span class="legend-item">目标: 65ms</span>
      </div>
    </section>

    <section class="hrv-monitor-card">
      <div class="hrv-header-row">
        <h2 class="monitor-title">❤️ HRV 实时监测</h2>
        <span class="hrv-badge" :class="getHRVBadgeClass()">
          <span class="badge-text">{{ hrvStatus }}</span>
        </span>
      </div>
      <div class="hrv-main-data">
        <div class="hrv-value-block">
          <span class="hrv-big-value">{{ currentHRV }}</span>
          <span class="hrv-unit">ms</span>
        </div>
        <div class="hrv-stats-block">
          <div class="stat-item">
            <span class="stat-label">心率</span>
            <span class="stat-value">{{ hrvStore.heartRate }} BPM</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">状态</span>
            <span class="stat-value trend">{{ hrvTrend }}</span>
          </div>
        </div>
      </div>
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: healingProgress + '%' }"></div>
        </div>
        <span class="progress-text">{{ healingProgress }}% 疗愈进行中</span>
      </div>
    </section>

    <section class="metrics-card">
      <div class="metric-item">
        <span class="metric-value">{{ healingScore }}</span>
        <span class="metric-label">综合指数</span>
      </div>
      <div class="metric-item">
        <span class="metric-value">{{ hrvImprove }}</span>
        <span class="metric-label">HRV 改善</span>
      </div>
      <div class="metric-item">
        <span class="metric-value">{{ rhythmSync }}</span>
        <span class="metric-label">节奏同步</span>
      </div>
      <div class="metric-item">
        <span class="metric-value">{{ relaxInduction }}</span>
        <span class="metric-label">放松诱导</span>
      </div>
    </section>

    <section class="hrv-loop-control">
      <div class="loop-toggle" @click="hrvLoopEnabled = !hrvLoopEnabled">
        <div :class="['toggle-switch', { active: hrvLoopEnabled }]">
          <div class="toggle-knob"></div>
        </div>
        <span class="loop-label">🔄 HRV 闭环模式: {{ hrvLoopEnabled ? 'ON' : 'OFF' }}</span>
      </div>
      <span class="loop-hint">当前: 每 5 秒动态调整音乐参数</span>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.container {
  @include mobile-container;
  padding: rpx(20);
}

.header {
  text-align: center;
  padding: rpx(20) 0;
}

.music-title {
  font-size: rpx(64);
  font-weight: bold;
  color: $text;
  font-family: 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin: 0;
}

.player-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: rpx(30) 0;
}

.vinyl-container {
  width: rpx(400);
  height: rpx(400);
  margin-bottom: rpx(40);
}

.vinyl {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 30%, #1a1a1a 60%, #333 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.vinyl.playing {
  animation: rotate 8s linear infinite;
  will-change: transform;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.vinyl-label {
  width: rpx(180);
  height: rpx(180);
  border-radius: 50%;
  background: $primary-gradient;
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-note {
  font-size: rpx(48);
  color: #fff;
}

.cover-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-display {
  font-size: rpx(28);
  color: $text-muted;
  margin-bottom: rpx(10);
}

.time-current {
  color: $text;
}

.progress-slider {
  width: 90%;
  margin: rpx(10) 0;
  accent-color: $primary;
}

.play-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: rpx(40);
  margin-top: rpx(20);
}

.btn-control,
.btn-play {
  background: transparent;
  border: none;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-play .icon {
  font-size: rpx(64);
}

.btn-control .icon {
  font-size: rpx(48);
}

.hrv-curve-card,
.hrv-monitor-card,
.metrics-card {
  background: rgba(42, 42, 69, 0.8);
  border-radius: rpx(20);
  padding: rpx(24);
  margin: rpx(20) 0;
  border: 1px solid rgba(255, 107, 0, 0.2);
}

.curve-title,
.monitor-title {
  font-size: rpx(28);
  font-weight: bold;
  margin-bottom: rpx(16);
  margin-top: 0;
}

.curve-container {
  height: rpx(150);
  margin: rpx(10) 0;
  position: relative;
}

.hrv-curve-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.hrv-curve {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: rpx(120);
}

.curve-dot {
  position: absolute;
  width: rpx(12);
  height: rpx(12);
  border-radius: 50%;
  transform: translateX(-50%);
}

.curve-line {
  position: absolute;
  bottom: 0;
  left: 0;
  height: rpx(4);
  background: linear-gradient(90deg, #FF8C42 0%, #FF6B00 100%);
  border-radius: rpx(2);
  transition: width 0.3s;
  display: block;
}

.curve-legend {
  display: flex;
  justify-content: space-between;
  font-size: rpx(22);
  color: $text-muted;
  margin-top: rpx(10);
}

.hrv-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: rpx(16);
}

.hrv-badge {
  padding: rpx(4) rpx(16);
  border-radius: rpx(20);
  background: rgba(255, 107, 0, 0.2);
}

.hrv-badge.relaxed {
  background: rgba(74, 222, 128, 0.2);
}

.hrv-badge.high-stress {
  background: rgba(255, 107, 0, 0.2);
}

.badge-text {
  font-size: rpx(24);
  color: $primary;
}

.hrv-main-data {
  display: flex;
  align-items: center;
  margin: rpx(20) 0;
}

.hrv-value-block {
  display: flex;
  align-items: baseline;
  margin-right: rpx(40);
}

.hrv-big-value {
  font-size: rpx(72);
  font-weight: bold;
  color: $primary;
}

.hrv-unit {
  font-size: rpx(28);
  color: $text-muted;
  margin-left: rpx(8);
}

.hrv-stats-block {
  flex: 1;
}

.stat-item {
  margin: rpx(8) 0;
}

.stat-label {
  font-size: rpx(24);
  color: $text-muted;
  margin-right: rpx(8);
}

.stat-value {
  font-size: rpx(28);
  color: $text;
}

.stat-value.trend {
  color: $primary;
}

.progress-section {
  margin-top: rpx(16);
}

.progress-bar {
  height: rpx(8);
  background: rgba(255, 255, 255, 0.1);
  border-radius: rpx(4);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B00 0%, #FF8C42 100%);
  border-radius: rpx(4);
  transition: width 0.3s;
}

.progress-text {
  font-size: rpx(22);
  color: $text-muted;
  margin-top: rpx(8);
  display: block;
  text-align: center;
}

.metrics-card {
  display: flex;
  justify-content: space-around;
}

.metric-item {
  text-align: center;
}

.metric-value {
  font-size: rpx(36);
  font-weight: bold;
  color: $primary;
  display: block;
}

.metric-label {
  font-size: rpx(22);
  color: $text-muted;
}

.hrv-loop-control {
  background: rgba(42, 42, 69, 0.6);
  border-radius: rpx(16);
  padding: rpx(20);
  margin-top: rpx(20);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loop-toggle {
  display: flex;
  align-items: center;
  gap: rpx(16);
  cursor: pointer;
}

.toggle-switch {
  width: rpx(80);
  height: rpx(40);
  border-radius: rpx(20);
  background: rgba(255, 255, 255, 0.2);
  position: relative;
  transition: background 0.3s;
}

.toggle-switch.active {
  background: $primary-gradient;
}

.toggle-knob {
  width: rpx(36);
  height: rpx(36);
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: rpx(2);
  left: rpx(2);
  transition: transform 0.3s;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(rpx(40));
}

.loop-label {
  font-size: rpx(28);
  color: $text;
}

.loop-hint {
  font-size: rpx(22);
  color: $text-muted;
  margin-top: rpx(8);
}
</style>