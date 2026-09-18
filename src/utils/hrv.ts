// HRV 计算工具 — 从 soundcare-app 的 .vue 内联类抽出

interface HRVDataPoint {
  value: number
  timestamp: number
}

/**
 * 简化版 HRV 计算器（首页用，只做 RMSSD + 心率状态）
 */
export class SimpleHRVCalculator {
  windowSize = 30_000
  rriBuffer: HRVDataPoint[] = []
  heartRateBuffer: HRVDataPoint[] = []

  addRRI(rriMs: number): void {
    this.rriBuffer.push({ value: rriMs, timestamp: Date.now() })
    this.cleanOldData()
  }

  addHeartRate(bpm: number): void {
    this.heartRateBuffer.push({ value: bpm, timestamp: Date.now() })
    this.cleanOldData()
  }

  private cleanOldData(): void {
    const cutoff = Date.now() - this.windowSize
    this.rriBuffer = this.rriBuffer.filter((d) => d.timestamp > cutoff)
    this.heartRateBuffer = this.heartRateBuffer.filter((d) => d.timestamp > cutoff)
  }

  calculateRMSSD(): number | null {
    if (this.rriBuffer.length < 2) return null
    const values = this.rriBuffer.map((d) => d.value)
    let sumSq = 0
    for (let i = 0; i < values.length - 1; i++) {
      const diff = values[i + 1] - values[i]
      sumSq += diff * diff
    }
    return Math.sqrt(sumSq / (values.length - 1))
  }

  getStatus(): string {
    const rmssd = this.calculateRMSSD()
    if (rmssd !== null) {
      if (rmssd > 80) return '深度放松'
      if (rmssd > 50) return '正常放松'
      if (rmssd > 30) return '中度压力'
      return '高压力'
    }
    if (this.heartRateBuffer.length < 5) return '数据不足'
    const avg =
      this.heartRateBuffer.reduce((a, b) => a + b.value, 0) /
      this.heartRateBuffer.length
    if (avg < 65) return '深度放松'
    if (avg < 75) return '正常放松'
    if (avg < 85) return '中度压力'
    return '高压力'
  }
}

/**
 * 完整版 HRV 计算器（Player 页用 — 滑动 RMSSD + SDNN + 状态分级）
 */
export class HRVCalculator {
  windowSize = 30_000
  rriBuffer: HRVDataPoint[] = []

  addRRI(rriMs: number): void {
    this.rriBuffer.push({ value: rriMs, timestamp: Date.now() })
    this.cleanOldData()
  }

  private cleanOldData(): void {
    const cutoff = Date.now() - this.windowSize
    this.rriBuffer = this.rriBuffer.filter((d) => d.timestamp > cutoff)
  }

  calculateRMSSD(): number | null {
    if (this.rriBuffer.length < 2) return null
    const values = this.rriBuffer.map((d) => d.value)
    let sumSq = 0
    for (let i = 0; i < values.length - 1; i++) {
      const diff = values[i + 1] - values[i]
      sumSq += diff * diff
    }
    return Math.sqrt(sumSq / (values.length - 1))
  }

  calculateSDNN(): number | null {
    if (this.rriBuffer.length < 2) return null
    const values = this.rriBuffer.map((d) => d.value)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    let sumSq = 0
    for (const v of values) {
      const d = v - mean
      sumSq += d * d
    }
    return Math.sqrt(sumSq / (values.length - 1))
  }

  getStatus(): 'relaxed' | 'normal' | 'stressed' | 'anxious' {
    const rmssd = this.calculateRMSSD()
    if (rmssd === null) return 'normal'
    if (rmssd > 80) return 'relaxed'
    if (rmssd > 50) return 'normal'
    if (rmssd > 30) return 'stressed'
    return 'anxious'
  }
}