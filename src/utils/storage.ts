// localStorage 包装 — 跨页数据 (对齐 soundcare-app 的 setStorageSync 行为)

const MUSIC_KEYS = {
  url: 'lastMusicUrl',
  title: 'lastMusicTitle',
  cover: 'lastCoverImageUrl',
  duration: 'lastMusicDuration',
} as const

const USER_KEYS = {
  id: 'userId',
} as const

export interface MusicInfo {
  url: string
  title: string
  cover: string
  duration: number
}

export const musicStorage = {
  get(): MusicInfo | null {
    const url = localStorage.getItem(MUSIC_KEYS.url)
    if (!url) return null
    return {
      url,
      title: localStorage.getItem(MUSIC_KEYS.title) || '疗愈音乐',
      cover: localStorage.getItem(MUSIC_KEYS.cover) || '',
      duration: Number(localStorage.getItem(MUSIC_KEYS.duration) || 180),
    }
  },
  set(m: MusicInfo): void {
    localStorage.setItem(MUSIC_KEYS.url, m.url)
    localStorage.setItem(MUSIC_KEYS.title, m.title)
    localStorage.setItem(MUSIC_KEYS.cover, m.cover)
    localStorage.setItem(MUSIC_KEYS.duration, String(m.duration))
  },
  clear(): void {
    Object.values(MUSIC_KEYS).forEach((k) => localStorage.removeItem(k))
  },
}

export const userStorage = {
  get(): string {
    let id = localStorage.getItem(USER_KEYS.id)
    if (!id) {
      id = `web-${crypto.randomUUID()}`
      localStorage.setItem(USER_KEYS.id, id)
    }
    return id
  },
}