<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { optimizePrompt } from '@/api/llm'
import { SimpleHRVCalculator } from '@/utils/hrv'
import {
  getTimePeriodName,
  getGreeting,
  getTimePeriodValue,
} from '@/utils/time'
import { matchSceneFromInput, SCENE_DESCRIPTIONS } from '@/utils/translate'
import type { Scene } from '@/types/api'

const router = useRouter()

const greeting = ref('')
const timePeriod = ref('')
const hrvStatus = ref('配对中...')
const heartRate = ref('--')
const hrvValue = ref('--')
const suggestions = ref('')
const todayMinutes = ref(0)
const hrvImprovement = ref(0)

const userInput = ref('')
const isAILoading = ref(false)

const exampleInputs = [
  '今天开了一天的会，感觉好累',
  '睡前想听点轻柔的音乐',
  '工作压力大，想放松一下',
  '明天有考试，需要专注音乐',
]

const hrvCalculator = new SimpleHRVCalculator()
let hrvUpdateTimer: ReturnType<typeof setInterval> | null = null

const mockHRVData = (): void => {
  const simulatedHR = 60 + Math.floor(Math.random() * 20)
  heartRate.value = String(simulatedHR)

  const interval = 60000 / simulatedHR
  const rri = interval + (Math.random() - 0.5) * 30
  hrvCalculator.addRRI(Math.round(rri))
  hrvCalculator.addHeartRate(simulatedHR)

  const rmssd = hrvCalculator.calculateRMSSD()
  if (rmssd !== null && rmssd > 0) {
    hrvValue.value = String(Math.round(rmssd))
  }

  hrvStatus.value = hrvCalculator.getStatus()

  if (hrvValue.value !== '--' && Number(hrvValue.value) > 50) {
    suggestions.value = '状态良好，推荐专注工作音乐'
    hrvImprovement.value = Math.round((Number(hrvValue.value) - 40) / 40 * 100)
  } else if (hrvValue.value !== '--' && Number(hrvValue.value) > 30) {
    suggestions.value = '建议选择减压场景音乐'
    hrvImprovement.value = Math.round((Number(hrvValue.value) - 30) / 30 * 100)
  } else {
    suggestions.value = '建议使用呼吸引导+减压音乐'
    hrvImprovement.value = 0
  }
}

const submitUserInput = async (): Promise<void> => {
  if (!userInput.value.trim() || isAILoading.value) return

  isAILoading.value = true

  try {
    const response = await optimizePrompt({
      user_input: userInput.value,
      time_period: getTimePeriodValue(),
    })
    router.push({
      path: '/ai-generate',
      query: {
        prompt: response.optimized_prompt,
        scene: response.scene,
      },
    })
  } catch (error) {
    console.error('LLM 优化失败:', error)
    const scene = matchSceneFromInput(userInput.value)
    router.push({
      path: '/generate',
      query: {
        fromAI: 'true',
        scene,
        customPrompt: userInput.value,
      },
    })
  } finally {
    isAILoading.value = false
  }
}

const selectExample = (example: string): void => {
  userInput.value = example
}

const scenes: Array<{ id: Scene; name: string; icon: string }> = [
  { id: 'sleep', name: '助眠', icon: '😴' },
  { id: 'relax', name: '减压', icon: '😌' },
  { id: 'focus', name: '专注', icon: '🎯' },
  { id: 'meditate', name: '冥想', icon: '🧘' },
  { id: 'study', name: '学习', icon: '📚' },
]

const goToGenerate = (sceneId: Scene): void => {
  const sceneDesc = SCENE_DESCRIPTIONS[sceneId] || ''
  router.push({
    path: '/generate',
    query: {
      scene: sceneId,
      timePeriod: timePeriod.value,
      sceneDesc,
    },
  })
}

const startPlayback = (): void => {
  router.push({ path: '/player' })
}

onMounted(() => {
  const hour = new Date().getHours()
  greeting.value = getGreeting(hour)
  timePeriod.value = getTimePeriodName(hour)

  mockHRVData()
  hrvUpdateTimer = setInterval(mockHRVData, 5000)
})

onUnmounted(() => {
  if (hrvUpdateTimer) clearInterval(hrvUpdateTimer)
})
</script>

<template>
  <div class="container">
    <header class="header">
      <h1 class="title"><span class="music-note">🎵</span> SoundCare</h1>
      <p class="subtitle">MTX项目 — 产品提案 SoundCare demo</p>
    </header>

    <section class="time-section">
      <span class="greeting">{{ greeting }}，现在是「{{ timePeriod }}」时段</span>
    </section>

    <section class="hrv-card">
      <div class="hrv-header">
        <span class="hrv-title">❤️ HRV 实时状态</span>
        <div class="pairing-indicator">
          <span class="pairing-dot"></span>
          <span class="pairing-text">配对中...</span>
        </div>
      </div>

      <div class="hrv-data">
        <div class="hrv-item">
          <span class="hrv-label">HRV</span>
          <span class="hrv-value">{{ hrvValue }}<span class="hrv-unit">ms</span></span>
        </div>
        <div class="hrv-divider"></div>
        <div class="hrv-item">
          <span class="hrv-label">心率</span>
          <span class="hrv-value">{{ heartRate }}<span class="hrv-unit">BPM</span></span>
        </div>
        <div class="hrv-divider"></div>
        <div class="hrv-item">
          <span class="hrv-label">状态</span>
          <span class="hrv-status">{{ hrvStatus }}</span>
        </div>
      </div>

      <div class="hrv-suggestion">
        <span class="suggestion-text">💡 {{ suggestions }}</span>
      </div>

      <div class="pairing-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: 60%"></div>
        </div>
        <span class="progress-text">正在搜索可穿戴设备...</span>
      </div>
    </section>

    <section class="paths-section">
      <div class="path-card ai-path">
        <div class="path-header">
          <span class="path-icon">✨</span>
          <span class="path-title">AI智能生成</span>
        </div>
        <p class="path-desc">描述心情，AI优化专属提示词</p>
        <div class="input-wrapper">
          <textarea
            v-model="userInput"
            class="ai-textarea"
            placeholder="例如：今天开了一天的会，感觉好累..."
            :disabled="isAILoading"
            maxlength="200"
          />
          <button
            class="btn-ai-submit"
            :disabled="!userInput.trim() || isAILoading"
            @click="submitUserInput"
          >
            {{ isAILoading ? '分析中...' : '🎵 AI生成' }}
          </button>
        </div>
        <div class="example-tags">
          <span
            v-for="example in exampleInputs"
            :key="example"
            class="example-tag"
            @click="selectExample(example)"
          >{{ example }}</span>
        </div>
      </div>

      <div class="path-card manual-path">
        <div class="path-header">
          <span class="path-icon">🎛️</span>
          <span class="path-title">手动场景选择</span>
        </div>
        <p class="path-desc">选择场景，调节参数生成</p>
        <div class="scenes-grid">
          <div
            v-for="scene in scenes"
            :key="scene.id"
            class="scene-item"
            @click="goToGenerate(scene.id)"
          >
            <span class="scene-icon">{{ scene.icon }}</span>
            <span class="scene-name">{{ scene.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="today-section">
      <h2 class="section-title">今日疗愈数据</h2>
      <div class="today-stats">
        <div class="stat-item">
          <span class="stat-value">{{ todayMinutes }}</span>
          <span class="stat-label">疗愈分钟</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ hrvImprovement }}%</span>
          <span class="stat-label">HRV改善</span>
        </div>
      </div>
    </section>

    <div class="actions">
      <button class="btn-primary" @click="startPlayback">
        🎵 开始播放专属音乐
      </button>
      <button class="btn-secondary">
        ⌚ 从手表同步HRV
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  @include mobile-container;
  padding: rpx(20);
}

.header {
  text-align: center;
  padding: rpx(40) 0;
}

.title {
  font-size: rpx(48);
  font-weight: bold;
  margin: 0;
}

.music-note {
  background: $primary-gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: rpx(26);
  color: #a0a0a0;
  margin-top: rpx(10);
  margin-bottom: 0;
}

.time-section {
  text-align: center;
  padding: rpx(20);
  background: rgba(42, 42, 69, 0.8);
  border-radius: rpx(16);
  margin-bottom: rpx(30);
  border: 1px solid rgba(192, 132, 252, 0.2);
}

.greeting {
  font-size: rpx(28);
  color: $text;
}

.hrv-card {
  background: rgba(42, 42, 69, 0.8);
  border-radius: rpx(20);
  padding: rpx(30);
  margin-bottom: rpx(30);
  border: 1px solid rgba(192, 132, 252, 0.2);
}

.hrv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: rpx(20);
}

.hrv-title {
  font-size: rpx(32);
  font-weight: bold;
}

.pairing-indicator {
  display: flex;
  align-items: center;
}

.pairing-dot {
  width: rpx(16);
  height: rpx(16);
  border-radius: 50%;
  background: #4ade80;
  margin-right: rpx(8);
}

.pairing-text {
  font-size: rpx(24);
  color: #4ade80;
}

.hrv-data {
  display: flex;
  justify-content: space-around;
  margin: rpx(15) 0;
}

.hrv-item {
  text-align: center;
}

.hrv-label {
  font-size: rpx(24);
  color: #888;
  margin-bottom: rpx(4);
  display: block;
}

.hrv-value {
  font-size: rpx(40);
  font-weight: bold;
  color: $primary;
}

.hrv-unit {
  font-size: rpx(24);
  color: #888;
  font-weight: normal;
}

.hrv-divider {
  width: 1px;
  height: rpx(50);
  background: rgba(255, 255, 255, 0.1);
}

.hrv-status {
  font-size: rpx(28);
  color: #fbbf24;
}

.hrv-suggestion {
  background: rgba(255, 255, 255, 0.05);
  border-radius: rpx(12);
  padding: rpx(15);
  margin-top: rpx(10);
}

.suggestion-text {
  font-size: rpx(24);
  color: #c0c0c0;
}

.pairing-progress {
  margin-top: rpx(10);
}

.progress-bar {
  height: rpx(8);
  background: rgba(255, 255, 255, 0.1);
  border-radius: rpx(4);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #60a5fa);
  border-radius: rpx(4);
  transition: width 0.3s;
}

.progress-text {
  font-size: rpx(22);
  color: #888;
  margin-top: rpx(10);
  display: block;
}

.paths-section {
  margin-bottom: rpx(30);
}

.path-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: rpx(20);
  padding: rpx(30);
  margin-bottom: rpx(20);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ai-path {
  border: 1px solid rgba(255, 107, 0, 0.3);
  background: linear-gradient(180deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 140, 66, 0.05) 100%);
}

.manual-path {
  border: 1px solid rgba(255, 140, 66, 0.3);
  background: linear-gradient(180deg, rgba(255, 140, 66, 0.08) 0%, rgba(255, 107, 0, 0.03) 100%);
}

.path-header {
  display: flex;
  align-items: center;
  margin-bottom: rpx(12);
}

.path-icon {
  font-size: rpx(36);
  margin-right: rpx(12);
}

.path-title {
  font-size: rpx(32);
  font-weight: bold;
  color: $text;
}

.path-desc {
  font-size: rpx(24);
  color: #888;
  margin-bottom: rpx(20);
  margin-top: 0;
}

.input-wrapper {
  background: rgba(42, 42, 69, 0.9);
  border-radius: rpx(16);
  padding: rpx(20);
  margin-bottom: rpx(16);
  border: 2px solid rgba(255, 107, 0, 0.4);
}

.ai-textarea {
  width: 100%;
  min-height: rpx(65);
  background: rgba(26, 26, 46, 0.8);
  border-radius: rpx(12);
  padding: rpx(16);
  font-size: rpx(28);
  color: $text;
  margin-bottom: rpx(16);
  border: 1px solid rgba(255, 107, 0, 0.3);
  display: block;
  resize: none;
}

.ai-textarea::placeholder {
  color: $text-muted;
}

.ai-textarea:focus {
  border-color: $primary;
}

.btn-ai-submit {
  @include btn-primary;
  width: 100%;
  font-size: rpx(30);
  padding: rpx(20);
}

.example-tags {
  display: flex;
  flex-wrap: wrap;
}

.example-tag {
  background: rgba(42, 42, 69, 0.9);
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: rpx(20);
  padding: rpx(12) rpx(20);
  font-size: rpx(22);
  color: $text;
  margin-right: rpx(12);
  margin-bottom: rpx(12);
  cursor: pointer;
  transition: all 0.2s;
}

.example-tag:active {
  background: rgba(255, 107, 0, 0.2);
  border-color: $primary;
  color: $primary;
}

.section-title {
  font-size: rpx(32);
  font-weight: bold;
  color: $primary;
  margin-bottom: rpx(20);
  margin-top: 0;
}

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: rpx(16);
}

.scene-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: rpx(16);
  padding: rpx(24) rpx(16);
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.scene-item:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.95);
}

.scene-icon {
  font-size: rpx(40);
  display: block;
  margin-bottom: rpx(8);
}

.scene-name {
  font-size: rpx(24);
  color: #e0e0e0;
}

.today-section {
  margin-bottom: rpx(30);
}

.today-stats {
  display: flex;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: rpx(16);
  padding: rpx(30);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: rpx(48);
  font-weight: bold;
  color: #60a5fa;
  display: block;
}

.stat-label {
  font-size: rpx(24);
  color: #888;
  margin-top: rpx(8);
  display: block;
}

.stat-divider {
  width: 1px;
  height: rpx(80);
  background: rgba(255, 255, 255, 0.1);
}

.actions {
  padding: rpx(20) 0;
}

.btn-primary {
  @include btn-primary;
  width: 100%;
  font-size: rpx(32);
  padding: rpx(24);
  margin-bottom: rpx(20);
}

.btn-secondary {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  font-size: rpx(28);
  padding: rpx(20);
  border-radius: rpx(50);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>