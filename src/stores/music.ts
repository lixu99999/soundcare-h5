import { defineStore } from 'pinia'
import { ref } from 'vue'
import { musicStorage, type MusicInfo } from '@/utils/storage'

// Pinia 缓存层 — 读取时优先看 store，没有再 fallback 到 storage
export const useMusicStore = defineStore('music', () => {
  const url = ref<string>('')
  const title = ref<string>('')
  const cover = ref<string>('')
  const duration = ref<number>(0)

  function load(): MusicInfo | null {
    const cached = musicStorage.get()
    if (cached) {
      url.value = cached.url
      title.value = cached.title
      cover.value = cached.cover
      duration.value = cached.duration
    }
    return cached
  }

  function set(m: MusicInfo): void {
    url.value = m.url
    title.value = m.title
    cover.value = m.cover
    duration.value = m.duration
    musicStorage.set(m)
  }

  function clear(): void {
    url.value = ''
    title.value = ''
    cover.value = ''
    duration.value = 0
    musicStorage.clear()
  }

  return { url, title, cover, duration, load, set, clear }
})