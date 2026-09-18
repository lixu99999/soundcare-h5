<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { generateMusic } from '@/api/music'
import { useMusicStore } from '@/stores/music'
import { showToast } from '@/utils/translate'
import { getTimePeriodValue } from '@/utils/time'
import type { TimePeriod } from '@/types/api'

const route = useRoute()
const router = useRouter()
const musicStore = useMusicStore()

const prompt = ref('')
const scene = ref('')
const isGenerating = ref(false)

onMounted(() => {
  const p = route.query.prompt
  prompt.value = typeof p === 'string' ? decodeURIComponent(p) : ''
  scene.value = (route.query.scene as string) || ''
})

const startGenerate = async (): Promise<void> => {
  if (isGenerating.value || !prompt.value) return

  isGenerating.value = true

  try {
    const data = await generateMusic({
      time_period: getTimePeriodValue(),
      provider: undefined,
      duration_minutes: 3,
      optimized_prompt: prompt.value,
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
      <span class="nav-title">AI 生成专属页</span>
      <span class="nav-placeholder"></span>
    </nav>

    <div class="scene-badge" v-if="scene">
      <span class="scene-text">场景：{{ scene }}</span>
    </div>

    <section class="prompt-section">
      <span class="section-title">✨ AI 生成的提示词</span>
      <div class="prompt-card">
        <p class="prompt-text">{{ prompt }}</p>
      </div>
      <span class="prompt-hint">提示词已优化，不可修改</span>
    </section>

    <div class="actions">
      <button class="btn-generate" :disabled="isGenerating || !prompt" @click="startGenerate">
        {{ isGenerating ? '🎵 生成中...' : '✨ 开始生成' }}
      </button>
      <button class="btn-back" @click="goBack">← 重新输入</button>
    </div>

    <div class="info-section">
      <span class="info-text">提示词由 AI 根据您的描述生成，已针对 Suno 音乐生成优化</span>
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

.scene-badge {
  background: rgba(255, 107, 0, 0.2);
  border-radius: rpx(20);
  padding: rpx(16) rpx(24);
  margin-bottom: rpx(30);
  text-align: center;
}

.scene-text {
  font-size: rpx(26);
  color: $primary;
}

.prompt-section {
  margin-bottom: rpx(40);
}

.section-title {
  font-size: rpx(28);
  color: #a0a0a0;
  margin-bottom: rpx(20);
  display: block;
}

.prompt-card {
  background: rgba(42, 42, 69, 0.9);
  border-radius: rpx(20);
  padding: rpx(30);
  border: 2px solid rgba(255, 107, 0, 0.4);
}

.prompt-text {
  font-size: rpx(28);
  color: $text;
  line-height: 1.6;
  margin: 0;
}

.prompt-hint {
  font-size: rpx(22);
  color: $text-muted;
  margin-top: rpx(16);
  display: block;
  text-align: center;
}

.actions {
  padding: rpx(20) 0;
}

.btn-generate {
  @include btn-primary;
  width: 100%;
  font-size: rpx(34);
  padding: rpx(28);
  margin-bottom: rpx(20);
}

.btn-back {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  color: #a0a0a0;
  font-size: rpx(28);
  padding: rpx(20);
  border-radius: rpx(50);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-section {
  margin-top: rpx(40);
  padding: rpx(20);
  text-align: center;
}

.info-text {
  font-size: rpx(22);
  color: #666;
}
</style>