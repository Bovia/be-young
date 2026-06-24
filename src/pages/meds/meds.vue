<template>
  <view class="page meds page-with-tabbar">
    <view class="header">
      <view class="page-title">药物管理</view>
      <view class="page-sub">管理老人的用药计划</view>
    </view>

    <view class="actions">
      <button class="btn btn-primary act" @click="openAdd()">＋ 手动添加</button>
      <button class="btn btn-warn act" @click="photoAdd()">📷 拍照识别</button>
    </view>

    <view v-if="state.meds.length === 0" class="card empty">
      <view class="empty-emoji">💊</view>
      <view class="empty-text">还没有药物，点上面添加吧</view>
    </view>

    <view class="med-list">
      <view v-for="m in state.meds" :key="m.id" class="med-item">
        <view class="med-info">
          <view class="med-name">{{ m.name }}</view>
          <view class="med-detail">
            {{ m.doseAmount }}{{ m.doseUnit }} · 每日{{ m.timings.length }}次 · {{ m.timings.join('、') }}
          </view>
          <view class="med-cycle">
            <text v-if="m.longTerm" class="tag tag-long">🔁 长期服用</text>
            <text v-else class="tag tag-short">
              📅 共{{ m.durationDays }}天，到{{ shortEndDate(m) }}结束
            </text>
          </view>
        </view>
        <view class="ops">
          <button class="op-btn edit-btn" @click="openAdd(m)">修改</button>
          <button class="op-btn del-btn" @click="confirmDel(m)">删除</button>
        </view>
      </view>
    </view>

    <!-- 添加/编辑表单（底部弹出） -->
    <view v-if="form.show" class="mask" @click="form.show = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle"></view>
        <view class="sheet-title">{{ form.id ? '修改药物' : '添加药物' }}</view>
        <scroll-view scroll-y class="sheet-scroll">

          <!-- 药名 -->
          <view class="field">
            <view class="field-label">药品名称</view>
            <input
              class="input"
              v-model="form.name"
              placeholder="如：降压片"
              placeholderStyle="color:#b0b8b2"
            />
          </view>

          <!-- 剂量：步进器 + 单位选择 -->
          <view class="field">
            <view class="field-label">每次剂量</view>
            <view class="dose-row">
              <view class="stepper">
                <view class="step-btn" @click="stepDose(-1)">－</view>
                <view class="step-val">{{ form.doseAmount }}</view>
                <view class="step-btn" @click="stepDose(1)">＋</view>
              </view>
              <view class="unit-pills">
                <view
                  v-for="u in DOSE_UNITS"
                  :key="u"
                  class="unit-pill"
                  :class="{ on: form.doseUnit === u }"
                  @click="form.doseUnit = u"
                >{{ u }}</view>
              </view>
            </view>
          </view>

          <!-- 时间段多选 -->
          <view class="field">
            <view class="field-label">什么时候吃 <text class="field-hint">（可多选）</text></view>
            <view class="timing-grid">
              <view
                v-for="t in TIMING_SLOTS"
                :key="t"
                class="timing-card"
                :class="{ on: form.timings.includes(t) }"
                @click="toggleTiming(t)"
              >
                <text class="timing-emoji">{{ timingEmoji(t) }}</text>
                <text class="timing-label">{{ t }}</text>
              </view>
            </view>
          </view>

          <!-- 长期/短期 -->
          <view class="field">
            <view class="field-label">服用周期</view>
            <view class="cycle-btns">
              <view
                class="cycle-btn"
                :class="{ on: form.longTerm }"
                @click="form.longTerm = true"
              >🔁 长期服用</view>
              <view
                class="cycle-btn"
                :class="{ on: !form.longTerm }"
                @click="form.longTerm = false"
              >📅 短期/疗程</view>
            </view>
          </view>

          <!-- 短期：吃几天 -->
          <view v-if="!form.longTerm" class="field">
            <view class="field-label">一共吃几天</view>
            <view class="duration-row">
              <view class="stepper">
                <view class="step-btn" @click="stepDays(-1)">－</view>
                <view class="step-val">{{ form.durationDays }}</view>
                <view class="step-btn" @click="stepDays(1)">＋</view>
              </view>
              <text class="duration-unit">天</text>
              <view class="duration-quick">
                <view
                  v-for="d in [3,5,7,10,14]" :key="d"
                  class="quick-tag"
                  :class="{ on: form.durationDays === d }"
                  @click="form.durationDays = d"
                >{{ d }}天</view>
              </view>
            </view>
            <view class="duration-hint" v-if="form.start">
              📅 {{ startDateLabel }} 开始，吃到 {{ endDateLabel }} 结束
            </view>
          </view>

          <!-- 开始日期（仅新增时显示） -->
          <view v-if="!form.id" class="field">
            <view class="field-label">从什么时候开始吃</view>
            <view class="start-btns">
              <view
                class="start-btn"
                :class="{ on: form.start === 'today' }"
                @click="form.start = 'today'"
              >今天就开始</view>
              <view
                class="start-btn"
                :class="{ on: form.start === 'tomorrow' }"
                @click="form.start = 'tomorrow'"
              >明天开始</view>
            </view>
          </view>

          <view style="height: 32rpx;"></view>
        </scroll-view>

        <view class="sheet-actions">
          <button class="btn btn-ghost half" @click="form.show = false">取消</button>
          <button class="btn btn-primary half" @click="save()">保存</button>
        </view>
      </view>
    </view>

    <!-- 拍照识别确认卡（超大字 + 两个大按钮） -->
    <view v-if="ocrConfirm.show" class="ocr-mask" @click.stop>
      <view class="ocr-card">
        <view class="ocr-title">识别结果，对吗？</view>
        <view class="ocr-name">{{ ocrConfirm.name }}</view>
        <view class="ocr-detail">
          {{ ocrConfirm.doseAmount }}{{ ocrConfirm.doseUnit }} · {{ ocrConfirm.timings.join('、') }}
        </view>
        <button class="btn btn-primary ocr-btn" @click="ocrYes">✓ 对的，就这样</button>
        <button class="btn btn-ghost ocr-btn" @click="ocrNo">不对，我自己改</button>
        <button class="btn ocr-family" @click="ocrFamily">让家人帮我改</button>
      </view>
    </view>

    <app-tabbar current="meds" />
  </view>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppTabbar from '../../components/app-tabbar/app-tabbar.vue'
import { state, addMed, updateMed, removeMed, TIMING_SLOTS, DOSE_UNITS, todayStr, dateAddDays } from '../../store/store.js'

const TIMING_EMOJIS = {
  '早餐前': '🌅', '早餐后': '🍳', '午餐前': '☀️', '午餐后': '🍱',
  '晚餐前': '🌇', '晚餐后': '🍛', '睡前': '🌙', '随餐': '🥢'
}
const timingEmoji = (t) => TIMING_EMOJIS[t] || '💊'

function shortEndDate(med) {
  if (!med.startDate || !med.durationDays) return '—'
  const end = dateAddDays(med.startDate, med.durationDays - 1)
  const d = new Date(end)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const form = reactive({
  show: false, id: '',
  name: '', doseAmount: 1, doseUnit: '片',
  timings: [], longTerm: true,
  durationDays: 7, start: 'today'
})

const ocrConfirm = reactive({
  show: false,
  name: '',
  doseAmount: 1,
  doseUnit: '片',
  timings: ['早餐后'],
  longTerm: true
})

onShow(() => {
  if (state.elderMode) {
    uni.reLaunch({ url: '/pages/home/home' })
  }
})

// 开始日期字符串
const startDateStr = computed(() => {
  const d = new Date()
  if (form.start === 'tomorrow') d.setDate(d.getDate() + 1)
  return todayStr(d)
})
const startDateLabel = computed(() => form.start === 'today' ? '今天' : '明天')
const endDateLabel = computed(() => {
  const end = dateAddDays(startDateStr.value, form.durationDays - 1)
  const d = new Date(end)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

function openAdd(m) {
  if (m) {
    Object.assign(form, {
      show: true, id: m.id, name: m.name,
      doseAmount: m.doseAmount, doseUnit: m.doseUnit,
      timings: [...m.timings], longTerm: m.longTerm,
      durationDays: m.durationDays || 7, start: 'today'
    })
  } else {
    Object.assign(form, {
      show: true, id: '', name: '',
      doseAmount: 1, doseUnit: '片',
      timings: [], longTerm: true,
      durationDays: 7, start: 'today'
    })
  }
}

function stepDose(delta) {
  const v = form.doseAmount + delta
  if (v >= 0.5 && v <= 10) form.doseAmount = v
}

function stepDays(delta) {
  const v = form.durationDays + delta
  if (v >= 1 && v <= 90) form.durationDays = v
}

function toggleTiming(t) {
  const idx = form.timings.indexOf(t)
  if (idx >= 0) form.timings.splice(idx, 1)
  else form.timings.push(t)
}

function save() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请填写药名', icon: 'none' })
    return
  }
  if (form.timings.length === 0) {
    uni.showToast({ title: '请选择服药时间', icon: 'none' })
    return
  }
  const payload = {
    name: form.name.trim(),
    doseAmount: form.doseAmount,
    doseUnit: form.doseUnit,
    timings: [...form.timings],
    longTerm: form.longTerm,
    durationDays: form.longTerm ? null : form.durationDays,
    // 修改时保留原来的 startDate，新增时根据选择计算
    ...(form.id ? {} : { startDate: startDateStr.value })
  }
  if (form.id) {
    updateMed(form.id, payload)
    uni.showToast({ title: '已修改', icon: 'success' })
  } else {
    addMed(payload)
    const msg = form.longTerm
      ? '已添加，长期服用'
      : `已添加，共 ${form.durationDays} 天`
    uni.showToast({ title: msg, icon: 'success' })
  }
  form.show = false
}

function confirmDel(m) {
  uni.showModal({
    title: '删除药物',
    content: `确定删除「${m.name}」吗？\n\n删药后请到 iPhone「日历」里搜索「小树该浇水」，手动删掉对应提醒。\n（小程序无法自动删日历里的提醒）`,
    confirmText: '确定删除',
    cancelText: '再想想',
    confirmColor: '#FF3B30',
    success: (res) => {
      if (res.confirm) {
        removeMed(m.id)
        uni.showToast({ title: '已删除', icon: 'none' })
      }
    }
  })
}

function photoAdd() {
  uni.chooseImage({
    count: 1,
    success: () => {
      uni.showLoading({ title: '识别中...' })
      setTimeout(() => {
        uni.hideLoading()
        Object.assign(ocrConfirm, {
          show: true,
          name: '阿司匹林肠溶片',
          doseAmount: 1,
          doseUnit: '片',
          timings: ['早餐后'],
          longTerm: true
        })
      }, 1200)
    }
  })
}

function ocrYes() {
  Object.assign(form, {
    show: true,
    id: '',
    name: ocrConfirm.name,
    doseAmount: ocrConfirm.doseAmount,
    doseUnit: ocrConfirm.doseUnit,
    timings: [...ocrConfirm.timings],
    longTerm: ocrConfirm.longTerm,
    durationDays: 7,
    start: 'tomorrow'
  })
  ocrConfirm.show = false
}

function ocrNo() {
  ocrConfirm.show = false
  openAdd()
}

function ocrFamily() {
  ocrConfirm.show = false
  uni.showToast({ title: '请让家人帮您修改', icon: 'none' })
}
</script>

<style scoped>
.meds { padding-top: calc(env(safe-area-inset-top) + 24rpx); }
.header { margin-bottom: var(--gap-section); }

.actions { display: flex; gap: 16rpx; margin-bottom: var(--gap-section); }
.act { flex: 1; height: 96rpx; font-size: 32rpx; }

.med-list {
  display: flex; flex-direction: column;
  background: var(--card); border-radius: var(--radius-md); overflow: hidden;
}
.med-item {
  display: flex; align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--separator);
}
.med-item:last-child { border-bottom: none; }
.med-info { flex: 1; min-width: 0; }
.med-name { font-size: 36rpx; font-weight: 600; }
.med-detail { font-size: 28rpx; color: var(--text-sub); margin-top: 6rpx; line-height: 1.4; }
.med-cycle { margin-top: 10rpx; }
.tag {
  display: inline-block;
  font-size: 24rpx; padding: 6rpx 16rpx; border-radius: 999rpx; font-weight: 600;
}
.tag-long { background: var(--accent-green-soft); color: #248a3d; }
.tag-short { background: var(--warn-soft); color: #bf6a00; }

.ops { display: flex; gap: 12rpx; flex-shrink: 0; margin-left: 16rpx; }
.op-btn {
  height: 72rpx; padding: 0 24rpx; border-radius: var(--radius-sm);
  font-size: 28rpx; font-weight: 600; border: none;
}
.op-btn::after { border: none; }
.edit-btn { background: var(--fill); color: var(--primary); }
.del-btn { background: var(--danger-soft); color: var(--danger); }

.empty { display: flex; flex-direction: column; align-items: center; gap: 14rpx; margin-bottom: 24rpx; padding: 48rpx 32rpx; }
.empty-emoji { font-size: 72rpx; }
.empty-text { color: var(--text-sub); font-size: 30rpx; }

.mask {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: flex-end; z-index: 99;
}
.sheet {
  width: 100%; background: var(--card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  max-height: 90vh;
  display: flex; flex-direction: column;
  padding-bottom: calc(env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.sheet-handle {
  width: 72rpx; height: 10rpx; border-radius: 999rpx; background: var(--fill);
  align-self: center; margin: 16rpx 0 0;
}
.sheet-title { font-size: 36rpx; font-weight: 600; text-align: center; padding: 20rpx 0 8rpx; }
.sheet-scroll { flex: 1; overflow: hidden; padding: 0 32rpx; }

.field { margin-bottom: 32rpx; }
.field-label { font-size: 30rpx; font-weight: 600; margin-bottom: 14rpx; }
.field-hint { font-size: 26rpx; color: var(--text-sub); font-weight: 400; }
.input {
  height: 96rpx; background: var(--fill); border-radius: var(--radius-sm);
  padding: 0 24rpx; font-size: 34rpx; color: var(--text);
}

.dose-row { display: flex; align-items: center; gap: 20rpx; flex-wrap: wrap; }
.stepper { display: flex; align-items: center; background: var(--fill); border-radius: var(--radius-sm); overflow: hidden; }
.step-btn {
  width: 88rpx; height: 88rpx; display: flex; align-items: center; justify-content: center;
  font-size: 40rpx; font-weight: 600; color: var(--primary);
}
.step-val { width: 76rpx; text-align: center; font-size: 36rpx; font-weight: 600; }
.unit-pills { display: flex; flex-wrap: wrap; gap: 12rpx; }
.unit-pill {
  padding: 14rpx 26rpx; border-radius: 999rpx; font-size: 28rpx; font-weight: 600;
  background: var(--fill); color: var(--text-sub); border: 2rpx solid transparent;
}
.unit-pill.on { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }

.timing-grid { display: flex; flex-wrap: wrap; gap: 14rpx; }
.timing-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: calc(25% - 11rpx); padding: 20rpx 0;
  background: var(--fill); border-radius: var(--radius-sm);
  border: 2rpx solid transparent; box-sizing: border-box;
}
.timing-card.on { background: var(--primary-soft); border-color: var(--primary); }
.timing-emoji { font-size: 40rpx; }
.timing-label { font-size: 24rpx; font-weight: 600; margin-top: 6rpx; color: var(--text-secondary); }
.timing-card.on .timing-label { color: var(--primary); }

.cycle-btns { display: flex; gap: 16rpx; }
.cycle-btn {
  flex: 1; text-align: center; padding: 26rpx 0; border-radius: var(--radius-sm);
  font-size: 30rpx; font-weight: 600; background: var(--fill); color: var(--text-sub);
  border: 2rpx solid transparent;
}
.cycle-btn.on { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }

.duration-row { display: flex; align-items: center; gap: 16rpx; flex-wrap: wrap; }
.duration-unit { font-size: 32rpx; font-weight: 600; }
.duration-quick { display: flex; gap: 12rpx; flex-wrap: wrap; }
.quick-tag {
  padding: 12rpx 22rpx; border-radius: 999rpx;
  font-size: 28rpx; font-weight: 600;
  background: var(--fill); color: var(--text-sub); border: 2rpx solid transparent;
}
.quick-tag.on { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }
.duration-hint {
  margin-top: 14rpx; padding: 16rpx 20rpx; border-radius: var(--radius-sm);
  background: var(--fill); font-size: 28rpx; color: var(--text-secondary); font-weight: 500;
}

.start-btns { display: flex; gap: 16rpx; }
.start-btn {
  flex: 1; text-align: center; padding: 26rpx 0; border-radius: var(--radius-sm);
  font-size: 30rpx; font-weight: 600; background: var(--fill); color: var(--text-sub);
  border: 2rpx solid transparent;
}
.start-btn.on { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }

.sheet-actions {
  display: flex; gap: 16rpx;
  padding: 20rpx 32rpx 28rpx;
  border-top: 1rpx solid var(--separator);
}
.half { flex: 1; height: 96rpx; font-size: 34rpx; }

.ocr-mask {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.ocr-card {
  width: 88%; max-width: 640rpx; background: var(--card); border-radius: var(--radius-lg);
  padding: 44rpx 36rpx; display: flex; flex-direction: column; align-items: center;
  margin: auto;
}
.ocr-title { font-size: 30rpx; color: var(--text-sub); margin-bottom: 16rpx; }
.ocr-name { font-size: 44rpx; font-weight: 600; text-align: center; margin-bottom: 10rpx; }
.ocr-detail { font-size: 30rpx; color: var(--text-sub); margin-bottom: 32rpx; text-align: center; }
.ocr-btn { width: 100%; height: 96rpx; font-size: 34rpx; margin-bottom: 16rpx; }
.ocr-family {
  background: transparent; color: var(--primary); font-size: 30rpx; font-weight: 500; border: none;
}
.ocr-family::after { border: none; }
</style>
