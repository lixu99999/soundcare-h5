// API 地址优先级：
//   1. 构建期环境变量 VITE_API_BASE_URL（用于本地指向不同后端）
//   2. 默认指向生产后端 https://api.collegegenerator.cn/api/v1
//
// 本地开发期如果不想走 https，可以用：
//   VITE_API_BASE_URL=http://localhost:8002/api/v1 npm run dev
// 或者保留 vite proxy（vite.config.ts 把 /api/* 转给 https://api.collegegenerator.cn）
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.collegegenerator.cn/api/v1'

export const API_TIMEOUT = 300_000 // 5 分钟 — Suno 音乐生成需要