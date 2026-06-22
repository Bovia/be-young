<template>
  <view class="page home page-with-tabbar">
    <!-- 顶部问候 -->
    <view class="greet">
      <view class="greet-title">{{ greetEmoji }} {{ greetText }}，{{ state.nickname }}</view>
      <view class="greet-sub">{{ subText }}</view>
    </view>

    <!-- 种树养成区 -->
    <view class="tree-zone">
      <view class="tree-emoji" :class="{ pop: popping }">{{ stage.emoji }}</view>
      <view class="tree-name">{{ stage.name }}</view>
      <view class="tree-desc">{{ stage.desc }}</view>
      <view class="streak-badge">🔥 连续 {{ streak }} 天</view>
    </view>

    <!-- 没有用药计划时的引导 -->
    <view v-if="todayGroups.length === 0" class="card empty">
      <view class="empty-emoji">🌱</view>
      <view class="empty-text">还没有用药计划</view>
      <button class="btn btn-primary add-first" @click="goMeds">去添加药物</button>
    </view>

    <template v-else>
      <!-- 按时间段分组展示 -->
      <view v-for="group in todayGroups" :key="group.timing" class="group">
        <view class="group-title" :class="{ active: group.timing === currentSlot }">
          <text class="group-dot" :class="{ active: group.timing === currentSlot }">●</text>
          {{ group.timing }}
          <text v-if="group.timing === currentSlot" class="now-badge">现在</text>
        </view>

        <view class="med-list">
          <view
            v-for="item in group.items"
            :key="item.key"
            class="card med-item"
            :class="{ done: item.taken }"
            @click="onTapItem(item)"
          >
            <view class="check" :class="{ checked: item.taken }">
              <text v-if="item.taken" class="check-icon">✓</text>
            </view>
            <view class="med-info">
              <view class="med-name">{{ item.name }}</view>
              <view class="med-detail">{{ item.doseAmount }}{{ item.doseUnit }} · {{ item.timing }}</view>
            </view>
            <view class="status-tag" :class="item.taken ? 'tag-done' : 'tag-todo'">
              {{ item.taken ? '已吃了' : '还没吃' }}
            </view>
          </view>
        </view>
      </view>

      <!-- 一键浇水大按钮 -->
      <view class="water-wrap">
        <button
          class="btn water-btn"
          :class="allTakenToday ? 'btn-ghost' : 'btn-primary'"
          @click="waterAll"
        >
          {{ allTakenToday ? '今天都吃完啦 💧' : '💧 一键浇水（今天都吃了）' }}
        </button>
      </view>
    </template>

    <!-- 夸夸浮层（点任意处关闭） -->
    <view v-if="praise.show" class="praise-mask" @click="praise.show = false">
      <view class="praise-card" @click.stop>
        <view class="praise-emoji">{{ praise.emoji }}</view>
        <view class="praise-text">{{ praise.text }}</view>
        <button class="btn btn-primary praise-close" @click="praise.show = false">好嘞！</button>
      </view>
    </view>

    <app-tabbar current="home" />
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppTabbar from '../../components/app-tabbar/app-tabbar.vue'
import {
  state,
  todayGroups,
  allTakenToday,
  streak,
  stage,
  getCurrentSlot,
  takeItem,
  undoItem,
  takeAllToday
} from '../../store/store.js'

const popping = ref(false)
const praise = reactive({ show: false, emoji: '🎉', text: '' })

const PRAISES = [
  { emoji: '🌳', text: '太棒了，小树又长高了一点！' },
  { emoji: '💪', text: '真乖！今天也元气满满！' },
  { emoji: '☀️', text: '吃完药，身体棒棒，儿女也放心呀！' },
  { emoji: '🎉', text: '又坚持了一次，小树好开心！' },
  { emoji: '🌟', text: '坚持吃药，好身体是最大的财富！' }
]

const currentSlot = computed(() => getCurrentSlot())

const greetText = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const greetEmoji = computed(() => {
  const h = new Date().getHours()
  return h >= 6 && h < 18 ? '🌤️' : '🌙'
})
const subText = computed(() => {
  if (todayGroups.value.length === 0) return '今天还没有用药计划哦～'
  if (allTakenToday.value) return '今天的药都吃完了，小树好开心！🎉'
  const left = todayGroups.value.reduce((s, g) => s + g.items.filter((i) => !i.taken).length, 0)
  return `小树今天还需要浇 ${left} 次水（吃药）哦～`
})

function popTree() {
  popping.value = true
  setTimeout(() => (popping.value = false), 600)
}

function showPraise() {
  const p = PRAISES[Math.floor(Math.random() * PRAISES.length)]
  praise.emoji = p.emoji
  praise.text = p.text
  praise.show = true
  // 不再自动消失，老人主动点"好嘞"才关闭
}

function haptic() {
  uni.vibrateShort({ type: 'medium' })
}

function onTapItem(item) {
  if (item.taken) {
    uni.showModal({
      title: '要撤销吗？',
      content: `把「${item.name}（${item.timing}）」改回"还没吃"？`,
      confirmText: '是的，撤销',
      cancelText: '手滑了，不撤',
      confirmColor: '#dd524d',
      success: (res) => {
        if (res.confirm) undoItem(item.medId, item.timing)
      }
    })
  } else {
    takeItem(item.medId, item.timing)
    haptic()
    popTree()
    showPraise()
  }
}

function waterAll() {
  if (allTakenToday.value) return
  takeAllToday()
  haptic()
  popTree()
  showPraise()
}

function goMeds() {
  if (state.elderMode) {
    uni.showToast({ title: '请家人帮忙添加用药', icon: 'none' })
    return
  }
  uni.reLaunch({ url: '/pages/meds/meds' })
}
</script>

<style scoped>
.home {
  padding-top: calc(env(safe-area-inset-top) + 40rpx);
}

/* 问候 */
.greet { text-align: center; margin-bottom: 20rpx; }
.greet-title { font-size: 46rpx; font-weight: 800; }
.greet-sub { font-size: 28rpx; color: var(--text-sub); margin-top: 10rpx; }

/* 种树区 */
.tree-zone {
  display: flex; flex-direction: column; align-items: center;
  padding: 20rpx 0 10rpx;
}
.tree-emoji { font-size: 180rpx; line-height: 1.1; }
.tree-emoji.pop { animation: pop 0.6s ease; }
@keyframes pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35) rotate(-6deg); }
  70%  { transform: scale(0.95) rotate(4deg); }
  100% { transform: scale(1); }
}
.tree-name { font-size: 44rpx; font-weight: 800; color: var(--primary-dark); margin-top: 10rpx; }
.tree-desc { font-size: 28rpx; color: var(--text-sub); margin-top: 6rpx; }
.streak-badge {
  margin-top: 24rpx;
  background: #fbe9c6; color: #a9701a;
  font-weight: 700; font-size: 30rpx;
  padding: 12rpx 32rpx; border-radius: 999rpx;
}

/* 时间段分组 */
.group { margin-top: 36rpx; }
.group-title {
  display: flex; align-items: center; gap: 12rpx;
  font-size: 30rpx; font-weight: 700; color: var(--text-sub);
  margin-bottom: 16rpx;
}
.group-title.active { color: var(--primary-dark); }
.group-dot { font-size: 20rpx; color: var(--text-sub); }
.group-dot.active { color: var(--primary); }
.now-badge {
  font-size: 22rpx; font-weight: 700;
  background: var(--primary); color: #fff;
  padding: 4rpx 16rpx; border-radius: 999rpx;
}

/* 药物卡片 */
.med-list { display: flex; flex-direction: column; gap: 20rpx; }
.med-item {
  display: flex; align-items: center;
  border: 3rpx solid transparent;
  active-opacity: 0.7;
}
.med-item.done { background: #f3f9f4; border-color: #cfe8d6; }

.check {
  width: 88rpx; height: 88rpx; border-radius: 50%;
  border: 5rpx solid #d4dcd6;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.check.checked { background: var(--primary); border-color: var(--primary); }
.check-icon { font-size: 46rpx; color: #fff; font-weight: 900; line-height: 1; }

.med-info { flex: 1; margin-left: 24rpx; }
.med-name { font-size: 38rpx; font-weight: 700; }
.med-detail { font-size: 28rpx; color: var(--text-sub); margin-top: 6rpx; }

.status-tag {
  font-size: 30rpx; font-weight: 700;
  padding: 10rpx 20rpx; border-radius: 16rpx;
  flex-shrink: 0;
}
.tag-todo { color: #b0885a; background: #fdf2e0; }
.tag-done { color: var(--primary-dark); background: var(--primary-soft); }

/* 一键浇水 */
.water-wrap { margin-top: 44rpx; }
.water-btn { height: 120rpx; font-size: 40rpx; }

/* 空状态 */
.empty { display: flex; flex-direction: column; align-items: center; gap: 18rpx; margin-top: 30rpx; }
.empty-emoji { font-size: 90rpx; }
.empty-text { color: var(--text-sub); font-size: 32rpx; }
.add-first { height: 100rpx; padding: 0 48rpx; }

/* 夸夸浮层 */
.praise-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 99;
}
.praise-card {
  background: #fff; border-radius: 40rpx;
  padding: 60rpx 60rpx 50rpx;
  display: flex; flex-direction: column; align-items: center;
  animation: popin 0.35s ease;
  min-width: 500rpx;
}
@keyframes popin {
  from { transform: scale(0.6); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.praise-emoji { font-size: 140rpx; }
.praise-text {
  font-size: 40rpx; font-weight: 800; color: var(--primary-dark);
  margin-top: 24rpx; text-align: center; line-height: 1.5;
}
.praise-close { height: 100rpx; width: 100%; margin-top: 36rpx; font-size: 36rpx; }
</style>
