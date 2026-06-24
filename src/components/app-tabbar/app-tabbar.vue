<template>
  <view class="tabbar">
    <view class="tabbar-inner">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ on: current === tab.key }"
        @click="go(tab)"
      >
        <text class="tab-text">{{ tab.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { state } from '../../store/store.js'

const props = defineProps({
  current: { type: String, required: true }
})

const allTabs = [
  { path: '/pages/home/home', text: '🌱 养成', key: 'home' },
  { path: '/pages/meds/meds', text: '💊 用药', key: 'meds' },
  { path: '/pages/records/records', text: '📅 记录', key: 'records' },
  { path: '/pages/archive/archive', text: '📋 档案', key: 'archive' },
  { path: '/pages/settings/settings', text: '⚙️ 设置', key: 'settings' }
]

const elderTabs = [
  { path: '/pages/home/home', text: '🌱 我的树', key: 'home' },
  { path: '/pages/records/records', text: '📅 记录', key: 'records' }
]

const tabs = computed(() => (state.elderMode ? elderTabs : allTabs))

function go(tab) {
  if (tab.key === props.current) return
  uni.reLaunch({ url: tab.path })
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: saturate(180%) blur(40rpx);
  -webkit-backdrop-filter: saturate(180%) blur(40rpx);
  border-top: 1rpx solid rgba(60, 60, 67, 0.12);
}
.tabbar-inner {
  display: flex;
  height: 98rpx;
}
.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tab-text {
  font-size: 26rpx;
  font-weight: 500;
  color: #8e8e93;
  letter-spacing: -0.2rpx;
}
.tab-item.on .tab-text {
  color: #007aff;
  font-weight: 600;
}
</style>
