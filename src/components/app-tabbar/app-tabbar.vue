<template>
  <view class="tabbar">
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
  display: flex;
  background: #fff;
  border-top: 2rpx solid #eef1ea;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 90;
}
.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 110rpx;
}
.tab-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #9aa59a;
}
.tab-item.on .tab-text {
  color: #2e9e5b;
  font-weight: 800;
}
</style>
