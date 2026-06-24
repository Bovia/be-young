<template>
  <view class="page archive page-with-tabbar">
    <view class="header">
      <view class="page-title">健康档案</view>
      <view class="page-sub">电子病历本 · 只存照片，方便复诊给医生看</view>
    </view>

    <button class="btn btn-primary add-btn" @click="pickPhoto">📷 拍照存入档案</button>

    <view v-if="groups.length === 0" class="card empty">
      <view class="empty-emoji">🏥</view>
      <view class="empty-text">还没有健康档案</view>
      <view class="empty-hint">拍照上传体检报告、化验单、诊单即可</view>
    </view>

    <view v-for="g in groups" :key="g.date" class="group">
      <view class="group-date">{{ formatDate(g.date) }}</view>
      <view class="arch-list">
        <view v-for="item in g.items" :key="item.id" class="arch-item">
          <image class="arch-img" :src="item.imagePath" mode="aspectFill" @click="preview(item)" />
          <view class="arch-info">
            <view class="arch-type">{{ typeLabel(item.type) }}</view>
            <view v-if="item.note" class="arch-note">{{ item.note }}</view>
          </view>
          <button class="del-btn" @click="confirmDel(item)">删除</button>
        </view>
      </view>
    </view>

    <!-- 选类型 -->
    <view v-if="pick.show" class="mask" @click="pick.show = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle"></view>
        <view class="sheet-title">这是什么单据？</view>
        <view class="type-grid">
          <view
            v-for="t in ARCHIVE_TYPES"
            :key="t.key"
            class="type-card"
            :class="{ on: pick.type === t.key }"
            @click="pick.type = t.key"
          >
            <text class="type-emoji">{{ t.emoji }}</text>
            <text class="type-name">{{ t.label }}</text>
          </view>
        </view>
        <button class="btn btn-primary save-type" @click="saveArchive">存进去</button>
      </view>
    </view>

    <app-tabbar current="archive" />
  </view>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { state, addArchive, removeArchive, getArchivesByDate, todayStr } from '../../store/store.js'
import { uploadArchiveImage } from '../../cloud/cloudbase.js'
import AppTabbar from '../../components/app-tabbar/app-tabbar.vue'

const ARCHIVE_TYPES = [
  { key: 'lab', emoji: '🧪', label: '化验单' },
  { key: 'checkup', emoji: '📋', label: '体检报告' },
  { key: 'prescription', emoji: '💊', label: '诊单/处方' },
  { key: 'other', emoji: '📄', label: '其他' }
]

const pick = reactive({ show: false, type: 'lab', tempPath: '' })
const groups = computed(() => getArchivesByDate())

onShow(() => {
  if (state.elderMode) {
    uni.reLaunch({ url: '/pages/home/home' })
  }
})

function typeLabel(key) {
  return ARCHIVE_TYPES.find((t) => t.key === key)?.label || '其他'
}

function formatDate(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`
}

function pickPhoto() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      pick.tempPath = res.tempFilePaths[0]
      pick.type = 'lab'
      pick.show = true
    }
  })
}

async function saveArchive() {
  if (!pick.tempPath) return
  uni.showLoading({ title: '保存中...' })
  const path = await uploadArchiveImage(pick.tempPath)
  addArchive({ type: pick.type, imagePath: path, date: todayStr() })
  uni.hideLoading()
  pick.show = false
  pick.tempPath = ''
  uni.showToast({ title: '已存入档案', icon: 'success' })
}

function preview(item) {
  uni.previewImage({ urls: [item.imagePath] })
}

function confirmDel(item) {
  uni.showModal({
    title: '删除这份档案？',
    content: '删除后无法恢复，确定吗？',
    confirmColor: '#FF3B30',
    success: (res) => {
      if (res.confirm) removeArchive(item.id)
    }
  })
}
</script>

<style scoped>
.archive { padding-top: calc(env(safe-area-inset-top) + 24rpx); }
.header { margin-bottom: var(--gap-section); }
.add-btn { height: 96rpx; font-size: 34rpx; margin-bottom: var(--gap-section); }

.empty { display: flex; flex-direction: column; align-items: center; gap: 12rpx; padding: 56rpx 32rpx; }
.empty-emoji { font-size: 72rpx; }
.empty-text { font-size: 32rpx; color: var(--text-sub); font-weight: 500; }
.empty-hint { font-size: 28rpx; color: var(--text-sub); text-align: center; line-height: 1.45; }

.group { margin-bottom: var(--gap-section); }
.group-date {
  font-size: 26rpx; font-weight: 600; color: var(--text-sub);
  margin-bottom: 10rpx; padding-left: 8rpx; letter-spacing: 0.5rpx;
}
.arch-list {
  background: var(--card); border-radius: var(--radius-md); overflow: hidden;
}
.arch-item {
  display: flex; align-items: center; gap: 20rpx;
  padding: 24rpx 28rpx; border-bottom: 1rpx solid var(--separator);
}
.arch-item:last-child { border-bottom: none; }
.arch-img { width: 128rpx; height: 128rpx; border-radius: var(--radius-sm); flex-shrink: 0; background: var(--fill); }
.arch-info { flex: 1; min-width: 0; }
.arch-type { font-size: 32rpx; font-weight: 600; }
.arch-note { font-size: 26rpx; color: var(--text-sub); margin-top: 4rpx; }
.del-btn {
  height: 68rpx; padding: 0 22rpx; border-radius: var(--radius-sm);
  background: var(--danger-soft); color: var(--danger); font-size: 28rpx; font-weight: 600; border: none;
  flex-shrink: 0;
}
.del-btn::after { border: none; }

.mask {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: flex-end; z-index: 99;
}
.sheet {
  width: 100%; background: var(--card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 16rpx 32rpx calc(env(safe-area-inset-bottom) + 32rpx);
}
.sheet-handle {
  width: 72rpx; height: 10rpx; border-radius: 999rpx; background: var(--fill);
  margin: 0 auto 20rpx;
}
.sheet-title { font-size: 34rpx; font-weight: 600; text-align: center; margin-bottom: 24rpx; }
.type-grid { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 28rpx; }
.type-card {
  width: calc(50% - 8rpx); padding: 28rpx 0; text-align: center;
  background: var(--fill); border-radius: var(--radius-sm);
  border: 2rpx solid transparent; box-sizing: border-box;
}
.type-card.on { background: var(--primary-soft); border-color: var(--primary); }
.type-emoji { font-size: 48rpx; display: block; }
.type-name { font-size: 28rpx; font-weight: 600; margin-top: 8rpx; display: block; color: var(--text-secondary); }
.type-card.on .type-name { color: var(--primary); }
.save-type { height: 96rpx; font-size: 34rpx; }
</style>
