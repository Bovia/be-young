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
      <view v-for="m in state.meds" :key="m.id" class="card med-item">
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
    confirmColor: '#dd524d',
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
.meds { padding-top: calc(env(safe-area-inset-top) + 40rpx); }
.header { margin-bottom: 30rpx; }

.actions { display: flex; gap: 24rpx; margin-bottom: 30rpx; }
.act { flex: 1; height: 106rpx; font-size: 34rpx; }

.med-list { display: flex; flex-direction: column; gap: 22rpx; }
.med-item { display: flex; align-items: center; }
.med-info { flex: 1; }
.med-name { font-size: 38rpx; font-weight: 700; }
.med-detail { font-size: 28rpx; color: var(--text-sub); margin-top: 8rpx; }
.med-cycle { margin-top: 8rpx; }
.tag {
  display: inline-block;
  font-size: 24rpx; padding: 6rpx 18rpx; border-radius: 999rpx;
}
.tag-long { background: var(--primary-soft); color: var(--primary-dark); }
.tag-short { background: #fdf2e0; color: #a9701a; }

/* 操作按钮（放大，老人容易点） */
.ops { display: flex; gap: 14rpx; }
.op-btn {
  height: 76rpx; padding: 0 28rpx; border-radius: 20rpx;
  font-size: 28rpx; font-weight: 700; border: none;
}
.op-btn::after { border: none; }
.edit-btn { background: #eef1ea; color: var(--primary-dark); }
.del-btn { background: #fdecec; color: #dd524d; }

.empty { display: flex; flex-direction: column; align-items: center; gap: 16rpx; margin-bottom: 24rpx; }
.empty-emoji { font-size: 80rpx; }
.empty-text { color: var(--text-sub); font-size: 30rpx; }

/* 弹出表单 */
.mask {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: flex-end; z-index: 99;
}
.sheet {
  width: 100%; background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  max-height: 90vh;
  display: flex; flex-direction: column;
  padding-bottom: calc(env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.sheet-handle {
  width: 80rpx; height: 8rpx; border-radius: 999rpx; background: #d4dcd6;
  align-self: center; margin: 24rpx 0 0;
}
.sheet-title { font-size: 40rpx; font-weight: 800; text-align: center; padding: 24rpx 0 10rpx; }
.sheet-scroll { flex: 1; overflow: hidden; padding: 0 40rpx; }

/* 字段 */
.field { margin-bottom: 36rpx; }
.field-label { font-size: 32rpx; font-weight: 700; margin-bottom: 18rpx; }
.field-hint { font-size: 26rpx; color: var(--text-sub); font-weight: 400; }
.input {
  height: 100rpx; background: #f3f5f1; border-radius: 20rpx;
  padding: 0 28rpx; font-size: 36rpx; color: var(--text);
}

/* 剂量步进器 */
.dose-row { display: flex; align-items: center; gap: 24rpx; flex-wrap: wrap; }
.stepper { display: flex; align-items: center; background: #f3f5f1; border-radius: 20rpx; overflow: hidden; }
.step-btn {
  width: 90rpx; height: 90rpx; display: flex; align-items: center; justify-content: center;
  font-size: 44rpx; font-weight: 700; color: var(--primary-dark);
}
.step-val { width: 80rpx; text-align: center; font-size: 38rpx; font-weight: 800; }
.unit-pills { display: flex; flex-wrap: wrap; gap: 14rpx; }
.unit-pill {
  padding: 14rpx 28rpx; border-radius: 999rpx; font-size: 30rpx; font-weight: 600;
  background: #f3f5f1; color: var(--text-sub); border: 3rpx solid transparent;
}
.unit-pill.on { background: var(--primary-soft); color: var(--primary-dark); border-color: var(--primary); }

/* 时间段多选 */
.timing-grid { display: flex; flex-wrap: wrap; gap: 18rpx; }
.timing-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: calc(25% - 14rpx); padding: 22rpx 0;
  background: #f3f5f1; border-radius: 24rpx;
  border: 4rpx solid transparent; box-sizing: border-box;
}
.timing-card.on { background: var(--primary-soft); border-color: var(--primary); }
.timing-emoji { font-size: 44rpx; }
.timing-label { font-size: 24rpx; font-weight: 600; margin-top: 8rpx; color: var(--text); }
.timing-card.on .timing-label { color: var(--primary-dark); }

/* 服用周期 */
.cycle-btns { display: flex; gap: 20rpx; }
.cycle-btn {
  flex: 1; text-align: center; padding: 28rpx 0; border-radius: 24rpx;
  font-size: 32rpx; font-weight: 700; background: #f3f5f1; color: var(--text-sub);
  border: 4rpx solid transparent;
}
.cycle-btn.on { background: var(--primary-soft); color: var(--primary-dark); border-color: var(--primary); }

/* 吃几天 */
.duration-row { display: flex; align-items: center; gap: 20rpx; flex-wrap: wrap; }
.duration-unit { font-size: 34rpx; font-weight: 700; }
.duration-quick { display: flex; gap: 14rpx; flex-wrap: wrap; }
.quick-tag {
  padding: 12rpx 24rpx; border-radius: 999rpx;
  font-size: 28rpx; font-weight: 600;
  background: #f3f5f1; color: var(--text-sub); border: 3rpx solid transparent;
}
.quick-tag.on { background: var(--primary-soft); color: var(--primary-dark); border-color: var(--primary); }
.duration-hint {
  margin-top: 18rpx; padding: 18rpx 24rpx; border-radius: 16rpx;
  background: #f3f9f4; font-size: 28rpx; color: var(--primary-dark); font-weight: 600;
}

/* 开始时间 */
.start-btns { display: flex; gap: 20rpx; }
.start-btn {
  flex: 1; text-align: center; padding: 28rpx 0; border-radius: 24rpx;
  font-size: 32rpx; font-weight: 700; background: #f3f5f1; color: var(--text-sub);
  border: 4rpx solid transparent;
}
.start-btn.on { background: var(--primary-soft); color: var(--primary-dark); border-color: var(--primary); }

/* 底部操作 */
.sheet-actions {
  display: flex; gap: 24rpx;
  padding: 24rpx 40rpx 32rpx;
  border-top: 2rpx solid #eef1ea;
}
.half { flex: 1; height: 106rpx; font-size: 36rpx; }

/* 拍照确认卡 */
.ocr-mask {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.ocr-card {
  width: 88%; max-width: 640rpx; background: #fff; border-radius: 36rpx;
  padding: 48rpx 40rpx; display: flex; flex-direction: column; align-items: center;
  margin: auto;
}
.ocr-title { font-size: 34rpx; color: var(--text-sub); margin-bottom: 20rpx; }
.ocr-name { font-size: 48rpx; font-weight: 800; text-align: center; margin-bottom: 12rpx; }
.ocr-detail { font-size: 32rpx; color: var(--text-sub); margin-bottom: 36rpx; text-align: center; }
.ocr-btn { width: 100%; height: 110rpx; font-size: 38rpx; margin-bottom: 20rpx; }
.ocr-family {
  background: transparent; color: var(--text-sub); font-size: 30rpx; border: none;
}
.ocr-family::after { border: none; }
</style>
