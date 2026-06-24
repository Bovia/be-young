<template>
  <view class="page records page-with-tabbar">
    <view class="header">
      <view class="page-title">服药记录</view>
      <view class="page-sub">查看历史服药情况</view>
    </view>

    <!-- 统计 -->
    <view class="stats">
      <view class="stat">
        <view class="stat-num">{{ streak }}</view>
        <view class="stat-label">连续天数</view>
      </view>
      <view class="stat">
        <view class="stat-num">{{ totalDoses }}</view>
        <view class="stat-label">总服药次</view>
      </view>
      <view class="stat">
        <view class="stat-num">{{ stage.emoji }}</view>
        <view class="stat-label">{{ stage.name }}</view>
      </view>
    </view>

    <!-- 标签切换：历史 / 计划 -->
    <view class="tab-bar">
      <view class="tab" :class="{ on: tab === 'history' }" @click="tab = 'history'">历史记录</view>
      <view class="tab" :class="{ on: tab === 'schedule' }" @click="tab = 'schedule'">📅 未来计划</view>
    </view>

    <!-- 历史记录 -->
    <template v-if="tab === 'history'">
      <!-- 日历 -->
      <view class="card calendar">
        <view class="cal-head">
          <view class="cal-nav" @click="changeMonth(-1)">‹</view>
          <view class="cal-title">{{ year }}年{{ month + 1 }}月</view>
          <view class="cal-nav" @click="changeMonth(1)">›</view>
        </view>
        <view class="week">
          <text v-for="w in weeks" :key="w" class="week-cell">{{ w }}</text>
        </view>
        <view class="days">
          <view
            v-for="(cell, i) in cells"
            :key="i"
            class="day-cell"
            :class="{ other: !cell.cur, today: cell.isToday, done: cell.done }"
          >
            <text class="day-num">{{ cell.day }}</text>
            <text v-if="cell.done" class="day-dot">✓</text>
          </view>
        </view>
        <view class="legend">
          <text class="legend-item"><text class="dot done-dot">✓</text> 已服药</text>
          <text class="legend-item"><text class="dot today-dot">○</text> 今天</text>
        </view>
      </view>

      <view class="card sync-card">
        <view class="sync-title">🔔 手机日历浇水提醒</view>
        <view class="sync-desc">
          适合长期稳定的用药。到点叫您打开小程序浇水，划掉通知不算完成。
        </view>
        <view class="sync-warn">
          ⚠️ 经常改药时不建议反复同步，日历里的旧提醒需自己去 iPhone「日历」里删。
        </view>

        <view v-if="reminderPreview.length" class="sync-preview">
          <view v-for="r in reminderPreview" :key="r.timing" class="preview-row">
            <text class="preview-time">{{ r.timeLabel }}</text>
            <text class="preview-title">{{ r.title }}</text>
          </view>
        </view>
        <view v-else class="sync-empty">还没有用药计划，先去「用药」页添加吧</view>

        <view v-if="state.calendarSyncedAt" class="sync-status" :class="{ warn: planNeedsResync }">
          {{ syncStatusText }}
        </view>

        <button
          class="btn btn-primary sync"
          :disabled="reminderPreview.length === 0"
          @click="handleSyncCalendar"
        >
          {{ state.calendarSyncedAt ? '重新同步（慎用）' : '同步到手机日历' }}
        </button>
        <view class="sync-tip">
          改药或删药后请重新同步；旧提醒需自己在 iPhone「日历」里搜索「{{ CALENDAR_SEARCH_KEYWORD }}」删除。
        </view>
      </view>

      <view class="section-title">📅 今天已服</view>
      <view v-if="todayList.length === 0" class="card empty-today">今天还没有服药记录</view>
      <view v-else class="today-list">
        <view v-for="(r, i) in todayList" :key="i" class="today-item">
          <view class="t-check">✓</view>
          <view class="t-info">
            <view class="t-name">{{ r.name }}</view>
            <view class="t-time">{{ r.timing }} · {{ r.time }} 服用</view>
          </view>
        </view>
      </view>
    </template>

    <!-- 未来计划 -->
    <template v-if="tab === 'schedule'">
      <view v-if="upcomingDays.length === 0" class="card empty-today">
        还没有用药计划，去"用药"页添加吧
      </view>
      <view v-else class="schedule-list">
        <view v-for="day in upcomingDays" :key="day.dateStr" class="card sched-day">
          <view class="sched-date">
            <view class="sched-label" :class="{ today: day.isToday }">
              {{ day.isToday ? '今天' : dateLabel(day.dateStr) }}
            </view>
            <view class="sched-full">{{ day.dateStr }}</view>
          </view>
          <view class="sched-meds">
            <!-- 按时间段分组 -->
            <view
              v-for="group in groupByTiming(day.items)"
              :key="group.timing"
              class="sched-group"
            >
              <view class="sched-timing">{{ group.timing }}</view>
              <view class="sched-names">
                <view
                  v-for="item in group.items"
                  :key="item.key"
                  class="sched-pill"
                  :class="{ taken: item.taken }"
                >
                  {{ item.taken ? '✓ ' : '' }}{{ item.name }} {{ item.doseAmount }}{{ item.doseUnit }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>

    <view v-if="state.elderMode" class="elder-link" @click="goSettings">⚙️ 设置（家人用）</view>

    <app-tabbar current="records" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppTabbar from '../../components/app-tabbar/app-tabbar.vue'
import {
  state,
  streak,
  totalDoses,
  stage,
  todayStr,
  getUpcomingDays,
  TIMING_SLOTS,
  markCalendarSynced
} from '../../store/store.js'
import {
  buildCalendarReminders,
  syncCalendarReminders,
  getPlanHash,
  formatReminderPreview,
  isCalendarApiAvailable,
  CALENDAR_SEARCH_KEYWORD
} from '../../utils/calendar.js'

const tab = ref('history')
const weeks = ['日', '一', '二', '三', '四', '五', '六']
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const todayKey = todayStr()

function keyOf(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const cells = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const prevDays = new Date(year.value, month.value, 0).getDate()
  const arr = []
  for (let i = 0; i < startDay; i++) {
    arr.push({ day: prevDays - startDay + 1 + i, cur: false, done: false, isToday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const k = keyOf(year.value, month.value, d)
    arr.push({
      day: d, cur: true,
      done: (state.records[k] || []).length > 0,
      isToday: k === todayKey
    })
  }
  let nextDay = 1
  while (arr.length % 7 !== 0) {
    arr.push({ day: nextDay++, cur: false, done: false, isToday: false })
  }
  return arr
})

function changeMonth(delta) {
  let m = month.value + delta
  let y = year.value
  if (m < 0) { m = 11; y-- }
  if (m > 11) { m = 0; y++ }
  month.value = m
  year.value = y
}

const todayList = computed(() => {
  const list = state.records[todayKey] || []
  return [...list].reverse()
})

const reminderPreview = computed(() => buildCalendarReminders(state))

const planNeedsResync = computed(() => {
  if (!state.calendarSyncedAt) return true
  return getPlanHash(state) !== state.calendarSyncPlanHash
})

const syncStatusText = computed(() => {
  if (!state.calendarSyncedAt) return ''
  const d = new Date(state.calendarSyncedAt)
  const label = `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (planNeedsResync.value) return `上次同步：${label} · 用药有变动，建议重新同步`
  return `已同步到手机日历（${label}）`
})

// 未来7天（含今天）
const upcomingDays = computed(() => getUpcomingDays(7))

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
function dateLabel(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK_LABELS[d.getDay()]}`
}

function groupByTiming(items) {
  const groups = {}
  for (const item of items) {
    if (!groups[item.timing]) groups[item.timing] = []
    groups[item.timing].push(item)
  }
  return TIMING_SLOTS.filter((t) => groups[t]).map((t) => ({ timing: t, items: groups[t] }))
}

async function handleSyncCalendar() {
  const tasks = reminderPreview.value
  if (!tasks.length) {
    uni.showToast({ title: '还没有用药计划', icon: 'none' })
    return
  }

  const preview = formatReminderPreview(tasks)
  const needResyncNote = state.calendarSyncedAt
    ? '\n\n⚠️ 重新同步不会自动删除旧提醒，请先在日历里删掉之前的「小树该浇水」。'
    : ''

  uni.showModal({
    title: '同步浇水提醒到手机日历',
    content: `将添加 ${tasks.length} 条每日提醒：\n\n${preview}\n\n到点会叫您打开长青伙伴给小树浇水。${needResyncNote}`,
    confirmText: '开始同步',
    cancelText: '先不',
    success: async (res) => {
      if (!res.confirm) return

      if (!isCalendarApiAvailable()) {
        uni.showModal({
          title: '请在手机里操作',
          content: `网页预览无法写入日历。\n\n请用微信开发者工具或手机扫码打开小程序，在「记录」页再点一次同步。\n\n将添加：\n${preview}`,
          showCancel: false
        })
        return
      }

      uni.showLoading({ title: '写入日历中...', mask: true })
      const result = await syncCalendarReminders(state)
      uni.hideLoading()

      if (result.ok) {
        markCalendarSynced(getPlanHash(state))
        uni.showModal({
          title: '同步成功 🌱',
          content: `已添加 ${result.success} 条浇水提醒。\n到点请打开小程序点「浇水」，日历里划掉不算完成哦。`,
          showCancel: false
        })
      } else if (result.reason === 'partial') {
        uni.showModal({
          title: '部分成功',
          content: `成功 ${result.success} 条，失败 ${result.failed} 条。\n请检查是否授权了「添加到日历」权限。`,
          showCancel: false
        })
      } else {
        uni.showToast({ title: '同步失败，请重试', icon: 'none' })
      }
    }
  })
}

function goSettings() {
  uni.reLaunch({ url: '/pages/settings/settings' })
}
</script>

<style scoped>
.records { padding-top: calc(env(safe-area-inset-top) + 24rpx); }
.header { margin-bottom: var(--gap-section); }

.stats {
  display: flex; gap: 12rpx; margin-bottom: var(--gap-section);
  background: var(--card); border-radius: var(--radius-md); overflow: hidden;
}
.stat { flex: 1; text-align: center; padding: 28rpx 0; position: relative; }
.stat + .stat::before {
  content: '';
  position: absolute; left: 0; top: 20%; height: 60%; width: 1rpx;
  background: var(--separator);
}
.stat-num { font-size: 48rpx; font-weight: 600; color: var(--text); }
.stat-label { font-size: 24rpx; color: var(--text-sub); margin-top: 6rpx; }

.tab-bar {
  display: flex; background: var(--fill); border-radius: var(--radius-sm);
  padding: 6rpx; margin-bottom: var(--gap-section);
}
.tab {
  flex: 1; text-align: center; padding: 18rpx 0;
  font-size: 28rpx; font-weight: 600; border-radius: 12rpx; color: var(--text-sub);
}
.tab.on { background: var(--card); color: var(--text); box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06); }

.calendar { padding: 28rpx 24rpx; margin-bottom: 4rpx; }
.cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.cal-title { font-size: 34rpx; font-weight: 600; }
.cal-nav {
  width: 60rpx; height: 60rpx; border-radius: 50%; background: var(--fill);
  display: flex; align-items: center; justify-content: center; font-size: 36rpx; color: var(--primary);
}
.week { display: flex; }
.week-cell { flex: 1; text-align: center; font-size: 24rpx; color: var(--text-sub); padding: 8rpx 0; font-weight: 600; }
.days { display: flex; flex-wrap: wrap; }
.day-cell {
  width: calc(100% / 7); height: 84rpx;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.day-num { font-size: 28rpx; font-weight: 500; }
.day-cell.other .day-num { color: #c7c7cc; }
.day-cell.today .day-num { color: var(--primary); font-weight: 600; }
.day-cell.today { background: var(--primary-soft); border-radius: 12rpx; }
.day-cell.done .day-num { color: var(--accent-green); font-weight: 600; }
.day-cell.done { background: var(--accent-green-soft); border-radius: 12rpx; }
.day-dot { font-size: 18rpx; color: var(--accent-green); line-height: 1; }
.legend {
  display: flex; justify-content: center; gap: 32rpx; margin-top: 12rpx;
  padding-top: 16rpx; border-top: 1rpx solid var(--separator);
}
.legend-item { font-size: 24rpx; color: var(--text-sub); }
.dot { margin-right: 6rpx; }
.done-dot { color: var(--accent-green); }

.sync-card { padding: 28rpx 32rpx; margin: 16rpx 0 var(--gap-section); }
.sync-title { font-size: 32rpx; font-weight: 600; margin-bottom: 8rpx; }
.sync-desc { font-size: 28rpx; color: var(--text-sub); line-height: 1.55; margin-bottom: 12rpx; }
.sync-warn {
  font-size: 26rpx; color: #bf6a00; background: var(--warn-soft);
  padding: 16rpx 20rpx; border-radius: var(--radius-sm); line-height: 1.5; margin-bottom: 16rpx;
}
.sync-preview { background: var(--fill); border-radius: var(--radius-sm); padding: 16rpx 20rpx; margin-bottom: 16rpx; }
.preview-row { display: flex; align-items: baseline; gap: 14rpx; padding: 8rpx 0; font-size: 28rpx; }
.preview-time { font-weight: 600; color: var(--primary); min-width: 88rpx; }
.preview-title { color: var(--text-secondary); flex: 1; }
.sync-empty { color: var(--text-sub); font-size: 28rpx; text-align: center; padding: 16rpx 0; }
.sync-status { font-size: 26rpx; color: var(--accent-green); margin-bottom: 12rpx; font-weight: 500; }
.sync-status.warn { color: #bf6a00; }
.sync { height: 96rpx; font-size: 32rpx; width: 100%; }
.sync-tip { font-size: 24rpx; color: var(--text-sub); line-height: 1.5; margin-top: 12rpx; }

.elder-link {
  text-align: center; font-size: 28rpx; color: var(--primary);
  padding: 20rpx 0; margin-top: 8rpx; font-weight: 500;
}

.section-title { font-size: 32rpx; font-weight: 600; margin: 8rpx 0 16rpx; padding-left: 8rpx; }
.empty-today { color: var(--text-sub); text-align: center; font-size: 30rpx; padding: 24rpx 0; }
.today-list {
  display: flex; flex-direction: column;
  background: var(--card); border-radius: var(--radius-md); overflow: hidden;
}
.today-item {
  display: flex; align-items: center;
  padding: 24rpx 28rpx; border-bottom: 1rpx solid var(--separator);
}
.today-item:last-child { border-bottom: none; }
.t-check {
  width: 56rpx; height: 56rpx; border-radius: 50%; background: var(--accent-green); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 32rpx; flex-shrink: 0;
}
.t-info { margin-left: 20rpx; }
.t-name { font-size: 32rpx; font-weight: 600; }
.t-time { font-size: 26rpx; color: var(--text-sub); margin-top: 4rpx; }

.schedule-list { display: flex; flex-direction: column; gap: 16rpx; }
.sched-day { padding: 28rpx 32rpx; }
.sched-date { margin-bottom: 16rpx; }
.sched-label { font-size: 32rpx; font-weight: 600; color: var(--text); }
.sched-label.today { color: var(--primary); }
.sched-full { font-size: 24rpx; color: var(--text-sub); margin-top: 4rpx; }
.sched-meds { display: flex; flex-direction: column; gap: 14rpx; }
.sched-group { display: flex; align-items: flex-start; gap: 14rpx; }
.sched-timing {
  font-size: 26rpx; font-weight: 600; color: var(--text-sub);
  white-space: nowrap; padding-top: 8rpx; min-width: 76rpx;
}
.sched-names { display: flex; flex-wrap: wrap; gap: 10rpx; }
.sched-pill {
  background: var(--fill); border-radius: 999rpx;
  padding: 10rpx 20rpx; font-size: 26rpx; color: var(--text-secondary);
}
.sched-pill.taken {
  background: var(--accent-green-soft); color: #248a3d; font-weight: 600;
}
</style>
