// 开发期：vite proxy 把 /api/* 转给 http://localhost:8002
// 生产期：环境变量或默认指向 https://api.collegegenerator.cn/api/v1
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const API_TIMEOUT = 300_000 // 5 分钟 — Suno 音乐生成需要