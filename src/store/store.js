import { reactive, computed } from 'vue'

const STORAGE_KEY = 'evergreen_state_v2'

export const TIMING_SLOTS = ['早餐前', '早餐后', '午餐前', '午餐后', '晚餐前', '晚餐后', '睡前', '随餐']
export const DOSE_UNITS = ['片', '粒', '支', '袋', '滴', '次']

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dateAddDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return todayStr(d)
}

export function dateDiffDays(a, b) {
  // a - b，返回天数差（正数表示 a 在 b 之后）
  return Math.round((new Date(a) - new Date(b)) / 86400000)
}

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function getCurrentSlot() {
  const h = new Date().getHours()
  if (h < 10) return '早餐后'
  if (h < 14) return '午餐后'
  if (h < 19) return '晚餐后'
  return '睡前'
}

/**
 * 判断某药在指定日期是否处于有效期内
 * longTerm=true  → 从 startDate 起永久有效
 * longTerm=false → 从 startDate 起 durationDays 天内有效
 */
export function isMedActiveOn(med, dateStr) {
  if (!med.startDate) return true // 老数据兼容：没有开始日期就一直显示
  if (dateDiffDays(dateStr, med.startDate) < 0) return false // 还没开始
  if (med.longTerm) return true
  // 短期药：startDate + durationDays - 1 = 最后一天
  const endDate = dateAddDays(med.startDate, (med.durationDays || 7) - 1)
  return dateDiffDays(dateStr, endDate) <= 0
}

function defaultState() {
  const today = todayStr()
  return {
    nickname: '詹丹丹',
    elderMode: false,
    meds: [
      {
        id: 'm1', name: '阿莫西林胶囊',
        doseAmount: 1, doseUnit: '粒',
        timings: ['早餐后', '午餐后', '晚餐后'],
        longTerm: false, durationDays: 7, startDate: today
      },
      {
        id: 'm2', name: '降压片',
        doseAmount: 1, doseUnit: '片',
        timings: ['早餐后'],
        longTerm: true, durationDays: null, startDate: today
      },
      {
        id: 'm3', name: '维生素D',
        doseAmount: 1, doseUnit: '粒',
        timings: ['随餐'],
        longTerm: true, durationDays: null, startDate: today
      }
    ],
    // records: { 'yyyy-mm-dd': [{ medId, timing, time }] }
    records: {},
    // 健康档案：[{ id, type, imagePath, date, note }]
    archives: [],
    // 日历同步状态
    calendarSyncedAt: null,
    calendarSyncPlanHash: null
  }
}

function load() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      // 兼容旧版本数据
      if (saved.meds && saved.meds[0] && saved.meds[0].frequency !== undefined) {
        return defaultState()
      }
      return { ...defaultState(), ...saved }
    }
  } catch (e) {}
  return defaultState()
}

export const state = reactive(load())

export function persist() {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {}
}

// —— 成长阶段 ——
const STAGES = [
  { min: 0,  level: 1, emoji: '🌱', name: '种子',     desc: '刚刚发芽' },
  { min: 3,  level: 2, emoji: '🌿', name: '小苗',     desc: '冒出嫩叶' },
  { min: 7,  level: 3, emoji: '🪴', name: '茁壮幼树', desc: '越长越精神' },
  { min: 15, level: 4, emoji: '🌳', name: '小树',     desc: '枝繁叶茂' },
  { min: 30, level: 5, emoji: '🌲', name: '长青树',   desc: '郁郁葱葱' }
]

// 指定日期的待打卡项（带有效期过滤）
export function getItemsForDate(dateStr) {
  const takenList = state.records[dateStr] || []
  const items = []
  for (const med of state.meds) {
    if (!isMedActiveOn(med, dateStr)) continue
    for (const timing of med.timings) {
      const rec = takenList.find((r) => r.medId === med.id && r.timing === timing)
      items.push({
        key: `${med.id}__${timing}`,
        medId: med.id,
        name: med.name,
        doseAmount: med.doseAmount,
        doseUnit: med.doseUnit,
        timing,
        taken: !!rec,
        takenTime: rec ? rec.time : ''
      })
    }
  }
  items.sort((a, b) => {
    const ia = TIMING_SLOTS.indexOf(a.timing)
    const ib = TIMING_SLOTS.indexOf(b.timing)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  return items
}

// 今日待打卡项
export const todayItems = computed(() => getItemsForDate(todayStr()))

// 今日按时间段分组
export const todayGroups = computed(() => {
  const groups = {}
  for (const item of todayItems.value) {
    if (!groups[item.timing]) groups[item.timing] = []
    groups[item.timing].push(item)
  }
  return TIMING_SLOTS
    .filter((t) => groups[t])
    .map((t) => ({ timing: t, items: groups[t] }))
})

export const allTakenToday = computed(
  () => todayItems.value.length > 0 && todayItems.value.every((i) => i.taken)
)

export const totalDoses = computed(() =>
  Object.values(state.records).reduce((sum, arr) => sum + arr.length, 0)
)

export const streak = computed(() => {
  let count = 0
  const d = new Date()
  const hasToday = (state.records[todayStr(d)] || []).length > 0
  if (!hasToday) d.setDate(d.getDate() - 1)
  while (true) {
    const key = todayStr(d)
    if ((state.records[key] || []).length > 0) {
      count++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return count
})

export const stage = computed(() => {
  const s = streak.value
  let cur = STAGES[0]
  for (const st of STAGES) if (s >= st.min) cur = st
  return cur
})

export const treeLevel = computed(() => stage.value.level)

// 未来 N 天计划（含今天）
export function getUpcomingDays(n = 7) {
  const days = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = todayStr(d)
    const items = getItemsForDate(dateStr)
    // 只保留当天有药的
    if (items.length > 0) {
      days.push({ dateStr, items, isToday: i === 0 })
    }
  }
  return days
}

// —— 操作 ——
export function takeItem(medId, timing) {
  const today = todayStr()
  if (!state.records[today]) state.records[today] = []
  if (state.records[today].some((r) => r.medId === medId && r.timing === timing)) return
  state.records[today].push({ medId, timing, time: nowTime() })
  persist()
}

export function undoItem(medId, timing) {
  const today = todayStr()
  if (!state.records[today]) return
  state.records[today] = state.records[today].filter(
    (r) => !(r.medId === medId && r.timing === timing)
  )
  persist()
}

export function takeAllToday() {
  todayItems.value.forEach((i) => {
    if (!i.taken) takeItem(i.medId, i.timing)
  })
}

export function addMed(med) {
  const id = 'm' + Date.now()
  state.meds.push({ id, ...med })
  persist()
  return id
}

export function updateMed(id, patch) {
  const m = state.meds.find((x) => x.id === id)
  if (m) Object.assign(m, patch)
  persist()
}

export function removeMed(id) {
  state.meds = state.meds.filter((m) => m.id !== id)
  persist()
}

export function setNickname(name) {
  state.nickname = name
  persist()
}

export function setElderMode(v) {
  state.elderMode = v
  persist()
}

export function markCalendarSynced(planHash) {
  state.calendarSyncedAt = new Date().toISOString()
  state.calendarSyncPlanHash = planHash
  persist()
}

export function addArchive(item) {
  const id = 'a' + Date.now()
  state.archives.unshift({
    id,
    type: item.type || '其他',
    imagePath: item.imagePath,
    date: item.date || todayStr(),
    note: item.note || ''
  })
  persist()
  return id
}

export function removeArchive(id) {
  state.archives = state.archives.filter((a) => a.id !== id)
  persist()
}

/** 档案按日期分组（新→旧） */
export function getArchivesByDate() {
  const map = {}
  for (const a of state.archives) {
    if (!map[a.date]) map[a.date] = []
    map[a.date].push(a)
  }
  return Object.keys(map)
    .sort((x, y) => (x < y ? 1 : -1))
    .map((date) => ({ date, items: map[date] }))
}
