<template>
  <view class="page settings page-with-tabbar">
    <view class="header">
      <view class="page-title">设置</view>
    </view>

    <!-- 称呼 -->
    <view class="card block">
      <view class="block-title">称呼</view>
      <view class="block-sub">设置显示在首页的昵称</view>
      <view class="name-row">
        <input class="input" v-model="name" placeholder="请输入称呼" />
        <button class="btn btn-primary save" @click="saveName">保存</button>
      </view>
    </view>

    <!-- 老人模式 -->
    <view class="card block row-block" @click="toggleElder">
      <view class="block-icon">🌳</view>
      <view class="block-main">
        <view class="block-title">老人模式</view>
        <view class="block-sub">极简界面，只保留「我的树」和「记录」</view>
      </view>
      <view class="switch" :class="{ on: state.elderMode }">
        <view class="knob"></view>
      </view>
    </view>

    <!-- 养成数据 -->
    <view class="card block">
      <view class="block-title">养成数据</view>
      <view class="data-row"><text>🌳 小树现在是</text><text class="data-val">{{ stage.emoji }} {{ stage.name }}</text></view>
      <view class="data-row"><text>🔥 已坚持</text><text class="data-val">{{ streak }} 天</text></view>
      <view class="data-row"><text>💊 总共吃了</text><text class="data-val">{{ totalDoses }} 次</text></view>
    </view>

    <!-- 云端同步（需配置云开发） -->
    <view class="card block">
      <view class="block-title">云端备份</view>
      <view class="block-sub">换手机不丢数据（需开通微信云开发）</view>
      <view class="cloud-status">{{ cloudStatusText }}</view>
    </view>

    <button class="btn logout" @click="logout">↩ 换个人用</button>

    <app-tabbar current="settings" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { state, streak, stage, totalDoses, setNickname, setElderMode } from '../../store/store.js'
import { isCloudReady, CLOUD_ENV_ID } from '../../cloud/cloudbase.js'
import AppTabbar from '../../components/app-tabbar/app-tabbar.vue'

const name = ref(state.nickname)

const cloudStatusText = computed(() => {
  if (isCloudReady()) return '云开发已连接，数据将自动备份'
  if (!CLOUD_ENV_ID) return '未配置：请在 cloud/cloudbase.js 填入环境 ID'
  return '请在微信开发者工具中开通云开发'
})

function saveName() {
  if (!name.value.trim()) {
    uni.showToast({ title: '称呼不能为空', icon: 'none' })
    return
  }
  setNickname(name.value.trim())
  uni.showToast({ title: '已保存', icon: 'success' })
}

function toggleElder() {
  const next = !state.elderMode
  setElderMode(next)
  uni.showToast({
    title: next ? '已开启老人模式' : '已关闭老人模式',
    icon: 'none'
  })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/home/home' })
  }, 400)
}

function logout() {
  uni.showModal({
    title: '换个人用？',
    content: '演示版暂未接入账号，正式版在这里可以切换到别人的用药计划。',
    showCancel: false,
    confirmText: '知道了'
  })
}
</script>

<style scoped>
.settings { padding-top: calc(env(safe-area-inset-top) + 40rpx); }
.header { margin-bottom: 30rpx; }
.block { margin-bottom: 26rpx; }
.block-title { font-size: 36rpx; font-weight: 800; }
.block-sub { font-size: 28rpx; color: var(--text-sub); margin-top: 8rpx; }

.name-row { display: flex; gap: 20rpx; margin-top: 20rpx; }
.input {
  flex: 1; height: 92rpx; background: #f3f5f1; border-radius: 20rpx;
  padding: 0 28rpx; font-size: 34rpx;
}
.save { width: 150rpx; height: 92rpx; }

.row-block { display: flex; align-items: center; }
.block-icon { font-size: 56rpx; margin-right: 20rpx; }
.block-main { flex: 1; }
.switch {
  width: 96rpx; height: 56rpx; border-radius: 999rpx; background: #d4dcd6;
  position: relative; transition: background 0.2s; flex-shrink: 0;
}
.switch.on { background: var(--primary); }
.knob {
  position: absolute; top: 6rpx; left: 6rpx;
  width: 44rpx; height: 44rpx; border-radius: 50%; background: #fff; transition: left 0.2s;
}
.switch.on .knob { left: 46rpx; }

.data-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 32rpx; padding: 22rpx 0; border-bottom: 2rpx solid #f0f3ef;
}
.data-row:last-child { border-bottom: none; }
.data-val { font-weight: 800; }

.cloud-status {
  margin-top: 16rpx; font-size: 28rpx; color: var(--text-sub); line-height: 1.5;
}

.logout {
  background: #fdecec; color: #dd524d; height: 100rpx; font-weight: 700;
  font-size: 34rpx; margin-top: 14rpx; border-radius: 24rpx;
}
.logout::after { border: none; }
</style>
