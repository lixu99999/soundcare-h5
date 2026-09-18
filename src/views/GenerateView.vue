<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { generateMusic } from '@/api/music'
import { useMusicStore } from '@/stores/music'
import {
  getSceneName,
  getInstrumentName,
  getAmbientName,
  translateInstrumentToEnglish,
  translateAmbientToEnglish,
  timePeriodNameToValue,
  showToast,
} from '@/utils/translate'
import type { Scene, Instrument, Ambient, TimePeriod } from '@/types/api'

const route = useRoute()
const router = useRouter()
const musicStore = useMusicStore()

const timePeriod = ref('')
const sceneId = ref<Scene>('focus')

interface Recommendation {
  bpm: number
  key: string
  instrument: string
  ambient: string
}
const recommendation = ref<Recommendation>({
  bpm: 82,
  key: 'C大调',
  instrument: '钢琴+弦乐',
  ambient: '雨声30%',
})

interface FormData {
  sceneInput: string
  tempo: 'slow' | 'medium' | 'fast'
  instrument: Instrument
  ambient: Ambient | 'white-noise'
  mixRatio: number
  duration: number
}
const formData = ref<FormData>({
  sceneInput: '',
  tempo: 'medium',
  instrument: 'piano',
  ambient: 'none',
  mixRatio: 30,
  duration: 15,
})

const tempoOptions = [
  { value: 'slow', label: '慢(50-70)', bpmRange: '50-70' },
  { value: 'medium', label: '中(70-100)', bpmRange: '70-100' },
  { value: 'fast', label: '快(100-120)', bpmRange: '100-120' },
] as const

const instrumentOptions: Array<{ value: Instrument; label: string; icon: string }> = [
  { value: 'piano', label: '钢琴', icon: '🎹' },
  { value: 'strings', label: '弦乐', icon: '🎻' },
  { value: 'pad', label: '电子Pad', icon: '🎛️' },
  { value: 'nature', label: '自然', icon: '🌿' },
]

const ambientOptions = [
  { value: 'none', label: '无', icon: '✖️' },
  { value: 'rain', label: '雨声', icon: '🌧️' },
  { value: 'ocean', label: '海浪', icon: '🌊' },
  { value: 'forest', label: '森林', icon: '🌲' },
  { value: 'white-noise', label: '白噪音', icon: '📻' },
] as const

const durationOptions = [
  { value: 5, label: '5分钟' },
  { value: 10, label: '10分钟' },
  { value: 15, label: '15分钟' },
  { value: 30, label: '30分钟' },
]

const updateRecommendation = (): void => {
  if (formData.value.tempo === 'slow') {
    recommendation.value.bpm = 60 + Math.floor(Math.random() * 10)
  } else if (formData.value.tempo === 'medium') {
    recommendation.value.bpm = 75 + Math.floor(Math.random() * 15)
  } else {
    recommendation.value.bpm = 95 + Math.floor(Math.random() * 15)
  }
  recommendation.value.instrument = getInstrumentName(formData.value.instrument)
  recommendation.value.ambient =
    formData.value.ambient === 'none' ? '无' : getAmbientName(formData.value.ambient as Ambient)
}

onMounted(() => {
  sceneId.value = (route.query.scene as Scene) || 'focus'
  timePeriod.value = (route.query.timePeriod as string) || '下午专注'

  const sceneDesc = route.query.sceneDesc
  if (typeof sceneDesc === 'string') {
    formData.value.sceneInput = decodeURIComponent(sceneDesc)
  }

  const scenePreset: Record<Scene, Partial<Recommendation>> = {
    sleep: { bpm: 55, key: 'A小调', ambient: '雨声25%', instrument: '钢琴+弦乐' },
    relax: { bpm: 68, key: 'C大调', ambient: '雨声', instrument: '钢琴+电子Pad' },
    focus: { bpm: 85, key: 'C大调', ambient: '无', instrument: '钢琴独奏' },
    meditate: { bpm: 60, key: '全音阶', ambient: '森林', instrument: 'Pad合成器' },
    study: { bpm: 75, key: 'C大调', ambient: '白噪音', instrument: '古典吉他' },
  }
  Object.assign(recommendation.value, scenePreset[sceneId.value])
  updateRecommendation()
})

const selectInstrument = (value: Instrument): void => {
  formData.value.instrument = value
  updateRecommendation()
}
const selectAmbient = (value: FormData['ambient']): void => {
  formData.value.ambient = value
  updateRecommendation()
}
const selectDuration = (value: number): void => {
  formData.value.duration = value
}
const selectTempo = (value: FormData['tempo']): void => {
  formData.value.tempo = value
  updateRecommendation()
}

const onMixRatioChange = (e: Event): void => {
  const target = e.target as HTMLInputElement
  formData.value.mixRatio = Number(target.value)
  updateRecommendation()
}

const isGenerating = ref(false)

const startGenerate = async (): Promise<void> => {
  if (isGenerating.value) return
  isGenerating.value = true

  try {
    const finalBpm =
      formData.value.tempo === 'slow'
        ? 60 + Math.floor(Math.random() * 10)
        : formData.value.tempo === 'medium'
          ? 75 + Math.floor(Math.random() * 15)
          : 95 + Math.floor(Math.random() * 15)

    const finalInstrument = getInstrumentName(formData.value.instrument)
    const finalAmbient = formData.value.ambient === 'none' ? '无' : `${formData.value.ambient}`
    const finalKey = recommendation.value.key || 'C大调'

    const instrumentEn = translateInstrumentToEnglish(finalInstrument)
    const ambientEn = translateAmbientToEnglish(finalAmbient)

    let mergedPrompt = ''
    if (formData.value.sceneInput.trim()) {
      const sceneDesc = formData.value.sceneInput.trim()
      const ambientPart = finalAmbient === '无' ? '' : `, ${ambientEn} ambient sounds`
      const instrumentPart = instrumentEn ? `, ${instrumentEn}` : ''
      mergedPrompt = `${sceneDesc}, ${finalBpm} BPM${instrumentPart}${ambientPart}`
    } else {
      const ambientPart = finalAmbient === '无' ? '' : `, ${ambientEn} ambient`
      mergedPrompt = `A ${finalBpm} BPM music, ${instrumentEn}${ambientPart}`
    }
    console.log('前端合并的 prompt:', mergedPrompt)

    const data = await generateMusic({
      time_period: timePeriodNameToValue(timePeriod.value) as TimePeriod,
      provider: undefined,
      duration_minutes: formData.value.duration,
      preferences: {
        bpm: finalBpm,
        key: finalKey,
        instrument: finalInstrument as unknown as Instrument,
        ambient: finalAmbient as unknown as Ambient,
        mix_ratio: formData.value.mixRatio,
      },
      optimized_prompt: mergedPrompt,
    })

    musicStore.set({
      url: data.music_url,
      title: data.music_title || '疗愈音乐',
      cover: data.cover_image_url || '',
      duration: data.duration || 180,
    })
    router.replace('/player')
  } catch (error) {
    console.error('生成音乐失败:', error)
    showToast('网络错误')
  } finally {
    isGenerating.value = false
  }
}

const goBack = (): void => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/')
  }
}
</script>

<template>
  <div class="container">
    <nav class="nav-bar">
      <span class="nav-back" @click="goBack">← 返回</span>
      <span class="nav-title">生成疗愈音乐</span>
      <span class="nav-placeholder"></span>
    </nav>

    <section class="time-info">
      <span class="time-label">当前时段：</span>
      <span class="time-value">{{ timePeriod }}</span>
      <span class="scene-badge scene-badge-large">{{ getSceneName(sceneId) }}</span>
    </section>

    <section class="scene-input-section">
      <h2 class="section-title">🎵 描述你的音乐场景（可选）</h2>
      <div class="input-wrapper">
        <textarea
          v-model="formData.sceneInput"
          class="scene-textarea"
          placeholder="例如：轻松的咖啡馆氛围，爵士钢琴..."
          maxlength="200"
        />
      </div>
    </section>

    <section class="recommendation-card">
      <h2 class="card-title">✨ {{ getSceneName(sceneId) }} 推荐参数</h2>
      <div class="recommendation-grid">
        <div class="recommend-item">
          <span class="recommend-label">BPM</span>
          <span class="recommend-value">{{ recommendation.bpm }}</span>
        </div>
        <div class="recommend-item">
          <span class="recommend-label">调式</span>
          <span class="recommend-value">{{ recommendation.key }}</span>
        </div>
        <div class="recommend-item">
          <span class="recommend-label">乐器</span>
          <span class="recommend-value">{{ recommendation.instrument }}</span>
        </div>
        <div class="recommend-item">
          <span class="recommend-label">氛围</span>
          <span class="recommend-value">{{ recommendation.ambient }}</span>
        </div>
      </div>
    </section>

    <section class="manual-section">
      <h2 class="section-title">手动调节</h2>

      <div class="control-group">
        <span class="control-label">节奏速度</span>
        <div class="tempo-options">
          <div
            v-for="option in tempoOptions"
            :key="option.value"
            :class="['tempo-item', { active: formData.tempo === option.value }]"
            @click="selectTempo(option.value)"
          >
            <span class="tempo-label">{{ option.label }}</span>
            <span class="tempo-range">{{ option.bpmRange }}</span>
          </div>
        </div>
      </div>

      <div class="control-group">
        <span class="control-label">音乐风格</span>
        <div class="instrument-options">
          <div
            v-for="option in instrumentOptions"
            :key="option.value"
            :class="['instrument-item', { active: formData.instrument === option.value }]"
            @click="selectInstrument(option.value)"
          >
            <span class="instrument-icon">{{ option.icon }}</span>
            <span class="instrument-name">{{ option.label }}</span>
          </div>
        </div>
      </div>

      <div class="control-group">
        <span class="control-label">氛围音</span>
        <div class="ambient-options">
          <div
            v-for="option in ambientOptions"
            :key="option.value"
            :class="['ambient-item', { active: formData.ambient === option.value }]"
            @click="selectAmbient(option.value)"
          >
            <span class="ambient-icon">{{ option.icon }}</span>
            <span class="ambient-name">{{ option.label }}</span>
          </div>
        </div>
        <div class="mix-ratio" v-if="formData.ambient !== 'none'">
          <span class="ratio-label">混音比例: {{ formData.mixRatio }}%</span>
          <input
            type="range"
            :value="formData.mixRatio"
            min="10"
            max="50"
            step="5"
            @input="onMixRatioChange"
            class="mix-slider"
          />
        </div>
      </div>

      <div class="control-group">
        <span class="control-label">时长</span>
        <div class="duration-options">
          <div
            v-for="option in durationOptions"
            :key="option.value"
            :class="['duration-item', { active: formData.duration === option.value }]"
            @click="selectDuration(option.value)"
          >
            <span class="duration-text">{{ option.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <div class="generate-action">
      <button class="btn-generate" :disabled="isGenerating" @click="startGenerate">
        {{ isGenerating ? '🎵 生成中...' : '✨ 开始生成' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  @include mobile-container;
  padding: rpx(20);
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: rpx(20) 0;
}

.nav-back {
  font-size: rpx(28);
  color: $primary;
  cursor: pointer;
}

.nav-title {
  font-size: rpx(32);
  font-weight: bold;
}

.nav-placeholder {
  width: rpx(100);
}

.time-info {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: rpx(12);
  padding: rpx(20);
  margin-bottom: rpx(30);
}

.time-label {
  font-size: rpx(26);
  color: #888;
}

.time-value {
  font-size: rpx(28);
  color: #e0e0e0;
  margin-right: rpx(16);
}

.scene-badge {
  font-size: rpx(22);
  background: #667eea;
  padding: rpx(6) rpx(16);
  border-radius: rpx(20);
  color: #fff;
}

.scene-badge-large {
  font-size: rpx(26);
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: rpx(10) rpx(24);
  border-radius: rpx(25);
  font-weight: bold;
}

.section-title {
  font-size: rpx(32);
  font-weight: bold;
  color: $text;
  margin-bottom: rpx(16);
  margin-top: 0;
}

.scene-input-section {
  margin-bottom: rpx(30);
}

.input-wrapper {
  background: rgba(42, 42, 69, 0.9);
  border-radius: rpx(16);
  padding: rpx(20);
  border: 2px solid rgba(255, 107, 0, 0.4);
}

.scene-textarea {
  width: 100%;
  min-height: rpx(100);
  background: rgba(26, 26, 46, 0.8);
  border-radius: rpx(12);
  padding: rpx(16);
  font-size: rpx(28);
  color: $text;
  border: 1px solid rgba(255, 107, 0, 0.3);
  display: block;
  resize: none;
}

.scene-textarea::placeholder {
  color: $text-muted;
}

.scene-textarea:focus {
  border-color: $primary;
}

.recommendation-card {
  background: rgba(42, 42, 69, 0.8);
  border-radius: rpx(20);
  padding: rpx(30);
  margin-bottom: rpx(30);
  border: 1px solid rgba(255, 107, 0, 0.3);
}

.card-title {
  font-size: rpx(32);
  font-weight: bold;
  color: $text;
  margin-bottom: rpx(20);
  margin-top: 0;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: rpx(20);
}

.recommend-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: rpx(12);
  padding: rpx(20);
  text-align: center;
}

.recommend-label {
  font-size: rpx(22);
  color: #888;
  display: block;
  margin-bottom: rpx(8);
}

.recommend-value {
  font-size: rpx(32);
  font-weight: bold;
  color: #60a5fa;
}

.manual-section {
  margin-bottom: rpx(40);
}

.control-group {
  margin-bottom: rpx(30);
}

.control-label {
  font-size: rpx(26);
  color: #e0e0e0;
  margin-bottom: rpx(16);
  display: block;
}

.tempo-options,
.instrument-options,
.ambient-options,
.duration-options {
  display: flex;
  justify-content: space-between;
}

.tempo-item,
.instrument-item,
.ambient-item,
.duration-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: rpx(12);
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.tempo-item,
.duration-item {
  padding: rpx(20);
  margin: 0 rpx(8);
}

.instrument-item {
  padding: rpx(20) rpx(10);
  margin: 0 rpx(6);
}

.ambient-item {
  padding: rpx(16) rpx(8);
  margin: 0 rpx(6);
  margin-bottom: rpx(16);
}

.tempo-item.active,
.instrument-item.active,
.ambient-item.active,
.duration-item.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
}

.tempo-label,
.duration-text {
  font-size: rpx(26);
  color: #e0e0e0;
  display: block;
}

.tempo-range {
  font-size: rpx(20);
  color: #888;
  margin-top: rpx(6);
  display: block;
}

.instrument-icon,
.ambient-icon {
  display: block;
  margin-bottom: rpx(8);
}

.instrument-icon {
  font-size: rpx(36);
}

.ambient-icon {
  font-size: rpx(32);
  margin-bottom: rpx(6);
}

.instrument-name,
.ambient-name {
  font-size: rpx(22);
  color: #e0e0e0;
}

.ambient-name {
  font-size: rpx(20);
}

.mix-ratio {
  margin-top: rpx(16);
}

.ratio-label {
  font-size: rpx(24);
  color: #888;
  margin-bottom: rpx(8);
  display: block;
}

.mix-slider {
  width: 100%;
  accent-color: $primary;
}

.generate-action {
  padding: rpx(20) 0;
}

.btn-generate {
  @include btn-primary;
  width: 100%;
  font-size: rpx(34);
  padding: rpx(28);
}
</style>