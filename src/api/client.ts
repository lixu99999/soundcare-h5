import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT } from './config'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

// 统一错误日志
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    console.error(`[API] ${status ?? 'NET'} ${url}`, error.message)
    return Promise.reject(error)
  },
)