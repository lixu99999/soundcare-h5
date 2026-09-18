import { defineStore } from 'pinia'
import { ref } from 'vue'

// Player 页的 HRV 实时状态 — 跟 audio 播放绑定
export const useHrvStore = defineStore('hrv', () => {
  const rmssd = ref<number>(0)
  const heartRate = ref<number>(0)
  const hrvStatus = ref<string>('数据收集中')
  const elapsedSeconds = ref<number>(0)
  const history = ref<Array<{ t: number; rmssd: number; hr: number }>>([])

  function reset() {
    rmssd.value = 0
    heartRate.value = 0
    hrvStatus.value = '数据收集中'
    elapsedSeconds.value = 0
    history.value = []
  }

  function record() {
    history.value.push({
      t: elapsedSeconds.value,
      rmssd: rmssd.value,
      hr: heartRate.value,
    })
    // 只保留最近 60 个点
    if (history.value.length > 60) history.value.shift()
  }

  return {
    rmssd,
    heartRate,
    hrvStatus,
    elapsedSeconds,
    history,
    reset,
    record,
  }
})