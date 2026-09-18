<script setup lang="ts">
import { ref } from 'vue'

const userNickname = ref('SoundCare用户')
const todayMinutes = ref(45)
const sleepImprovement = ref('+12%')
const meditationCount = ref(3)

interface Preferences {
  instrument: string
  ambient: string
  wakeTime: string
  sleepTime: string
}
const preferences = ref<Preferences>({
  instrument: '钢琴',
  ambient: '雨声',
  wakeTime: '7:00',
  sleepTime: '23:00',
})

interface HistoryRecord {
  time: string
  scene: string
  duration: string
  hrvImprove: string
}
const historyRecords = ref<HistoryRecord[]>([
  { time: '昨天 22:30', scene: '睡前助眠', duration: '30分钟', hrvImprove: '+28%' },
  { time: '今天 12:15', scene: '午休放松', duration: '15分钟', hrvImprove: '+15%' },
  { time: '今天 14:00', scene: '下午专注', duration: '45分钟', hrvImprove: '+22%' },
])

interface DeviceStatus {
  connected: boolean
  lastSync: string
}
const deviceStatus = ref<{ appleWatch: DeviceStatus; huaweiWatch: DeviceStatus }>({
  appleWatch: { connected: true, lastSync: '2分钟前' },
  huaweiWatch: { connected: false, lastSync: '-' },
})
</script>

<template>
  <div class="container">
    <header class="user-header">
      <div class="avatar">
        <span class="avatar-icon">👤</span>
      </div>
      <div class="user-info">
        <h1 class="nickname">{{ userNickname }}</h1>
        <p class="user-desc">HRV 疗愈记录者</p>
      </div>
    </header>

    <section class="today-stats-card">
      <h2 class="card-title">📊 今日数据</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">🎵</span>
          <span class="stat-number">{{ todayMinutes }}</span>
          <span class="stat-label">疗愈分钟</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">💤</span>
          <span class="stat-number">{{ sleepImprovement }}</span>
          <span class="stat-label">睡眠改善</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">🧘</span>
          <span class="stat-number">{{ meditationCount }}</span>
          <span class="stat-label">冥想次数</span>
        </div>
      </div>
    </section>

    <section class="preferences-card">
      <h2 class="card-title">⚙️ 我的偏好</h2>
      <div class="preference-list">
        <div class="preference-item">
          <span class="pref-icon">🎹</span>
          <span class="pref-label">最爱乐器</span>
          <span class="pref-value">{{ preferences.instrument }}</span>
          <span class="pref-arrow">›</span>
        </div>
        <div class="preference-item">
          <span class="pref-icon">🌧️</span>
          <span class="pref-label">氛围音</span>
          <span class="pref-value">{{ preferences.ambient }}</span>
          <span class="pref-arrow">›</span>
        </div>
        <div class="preference-item">
          <span class="pref-icon">⏰</span>
          <span class="pref-label">起床时间</span>
          <span class="pref-value">{{ preferences.wakeTime }}</span>
          <span class="pref-arrow">›</span>
        </div>
        <div class="preference-item">
          <span class="pref-icon">😴</span>
          <span class="pref-label">入睡时间</span>
          <span class="pref-value">{{ preferences.sleepTime }}</span>
          <span class="pref-arrow">›</span>
        </div>
      </div>
    </section>

    <section class="devices-card">
      <h2 class="card-title">⌚ 设备管理</h2>
      <div class="device-list">
        <div class="device-item">
          <span class="device-icon">🍎</span>
          <div class="device-info">
            <h3 class="device-name">Apple Watch</h3>
            <span class="device-status" v-if="deviceStatus.appleWatch.connected">
              <span class="status-dot connected"></span>
              已连接 · {{ deviceStatus.appleWatch.lastSync }}
            </span>
            <span class="device-status disconnected" v-else>未连接</span>
          </div>
          <button class="btn-device">管理</button>
        </div>
        <div class="device-item">
          <span class="device-icon">📱</span>
          <div class="device-info">
            <h3 class="device-name">华为手表</h3>
            <span class="device-status disconnected" v-if="!deviceStatus.huaweiWatch.connected">
              未连接
            </span>
            <span class="device-status" v-else>
              <span class="status-dot connected"></span>
              已连接 · {{ deviceStatus.huaweiWatch.lastSync }}
            </span>
          </div>
          <button class="btn-device">配对</button>
        </div>
      </div>
    </section>

    <section class="history-card">
      <h2 class="card-title">📜 历史记录</h2>
      <div class="history-list">
        <div class="history-item" v-for="(record, index) in historyRecords" :key="index">
          <div class="history-left">
            <span class="history-time">{{ record.time }}</span>
            <span class="history-scene">{{ record.scene }}</span>
          </div>
          <div class="history-right">
            <span class="history-duration">{{ record.duration }}</span>
            <span class="history-hrv">{{ record.hrvImprove }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="settings-card">
      <div class="setting-item">
        <span class="setting-icon">🔔</span>
        <span class="setting-label">提醒设置</span>
        <span class="setting-arrow">›</span>
      </div>
      <div class="setting-item">
        <span class="setting-icon">📊</span>
        <span class="setting-label">数据同步</span>
        <span class="setting-arrow">›</span>
      </div>
      <div class="setting-item">
        <span class="setting-icon">❓</span>
        <span class="setting-label">帮助</span>
        <span class="setting-arrow">›</span>
      </div>
      <div class="setting-item">
        <span class="setting-icon">ℹ️</span>
        <span class="setting-label">关于</span>
        <span class="setting-arrow">›</span>
      </div>
    </section>

    <footer class="version-info">
      <span class="version-text">SoundCare v1.0.0</span>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.container {
  @include mobile-container;
  padding: rpx(20);
}

.user-header {
  display: flex;
  align-items: center;
  padding: rpx(40) rpx(20);
  background: rgba(255, 255, 255, 0.05);
  border-radius: rpx(20);
  margin-bottom: rpx(20);
}

.avatar {
  width: rpx(100);
  height: rpx(100);
  background: $primary-gradient;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: rpx(24);
}

.avatar-icon {
  font-size: rpx(50);
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: rpx(36);
  font-weight: bold;
  margin: 0 0 rpx(8) 0;
}

.user-desc {
  font-size: rpx(24);
  color: #888;
  margin: 0;
}

.today-stats-card,
.preferences-card,
.devices-card,
.history-card,
.settings-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: rpx(20);
  padding: rpx(30);
  margin-bottom: rpx(20);
}

.card-title {
  font-size: rpx(28);
  color: #a0a0a0;
  margin: 0 0 rpx(20) 0;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: rpx(40);
  display: block;
  margin-bottom: rpx(8);
}

.stat-number {
  font-size: rpx(40);
  font-weight: bold;
  color: #60a5fa;
  display: block;
}

.stat-label {
  font-size: rpx(22);
  color: #888;
}

.preference-list,
.device-list,
.history-list {
  background: rgba(255, 255, 255, 0.05);
  border-radius: rpx(16);
  padding: rpx(10) 0;
}

.preference-item,
.setting-item {
  display: flex;
  align-items: center;
  padding: rpx(24) rpx(20);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.preference-item:last-child,
.setting-item:last-child {
  border-bottom: none;
}

.pref-icon,
.setting-icon {
  font-size: rpx(32);
  margin-right: rpx(20);
}

.pref-label,
.setting-label {
  font-size: rpx(28);
  color: #e0e0e0;
  flex: 1;
}

.pref-value {
  font-size: rpx(28);
  color: #888;
}

.pref-arrow,
.setting-arrow {
  font-size: rpx(32);
  color: #666;
  margin-left: rpx(16);
}

.device-item {
  display: flex;
  align-items: center;
  padding: rpx(24) rpx(20);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.device-item:last-child {
  border-bottom: none;
}

.device-icon {
  font-size: rpx(40);
  margin-right: rpx(20);
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: rpx(28);
  color: #e0e0e0;
  display: block;
  margin: 0 0 rpx(6) 0;
}

.device-status {
  font-size: rpx(22);
  color: #888;
}

.status-dot {
  display: inline-block;
  width: rpx(12);
  height: rpx(12);
  border-radius: 50%;
  margin-right: rpx(8);
}

.status-dot.connected {
  background: #4ade80;
}

.device-status.disconnected {
  color: #666;
}

.btn-device {
  font-size: rpx(24);
  background: rgba(102, 126, 234, 0.2);
  color: #a0a0ff;
  padding: rpx(12) rpx(24);
  border-radius: rpx(20);
  border: none;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: rpx(20);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.history-item:last-child {
  border-bottom: none;
}

.history-left {
  flex: 1;
}

.history-time {
  font-size: rpx(24);
  color: #888;
  display: block;
  margin-bottom: rpx(6);
}

.history-scene {
  font-size: rpx(28);
  color: #e0e0e0;
}

.history-right {
  text-align: right;
}

.history-duration {
  font-size: rpx(24);
  color: #888;
  display: block;
  margin-bottom: rpx(6);
}

.history-hrv {
  font-size: rpx(26);
  color: #4ade80;
  font-weight: bold;
}

.version-info {
  text-align: center;
  padding: rpx(40) 0;
}

.version-text {
  font-size: rpx(24);
  color: #666;
}
</style>