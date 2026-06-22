import { TIMING_SLOTS, todayStr, dateAddDays } from '../store/store.js'

/** 各时段默认提醒时间（可在设置页扩展为可配置） */
export const TIMING_DEFAULT_TIMES = {
  早餐前: { hour: 7, minute: 30 },
  早餐后: { hour: 8, minute: 30 },
  午餐前: { hour: 11, minute: 30 },
  午餐后: { hour: 12, minute: 30 },
  晚餐前: { hour: 17, minute: 30 },
  晚餐后: { hour: 18, minute: 30 },
  睡前: { hour: 21, minute: 0 },
  随餐: { hour: 12, minute: 0 }
}

export const CALENDAR_SEARCH_KEYWORD = '小树该浇水'

function unixAt(dateStr, hour, minute) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.floor(new Date(y, m - 1, d, hour, minute, 0).getTime() / 1000)
}

function medEndDate(med) {
  if (med.longTerm) return null
  return dateAddDays(med.startDate || todayStr(), (med.durationDays || 7) - 1)
}

/** 根据当前用药计划，生成要写入手机日历的提醒列表（按时段合并） */
export function buildCalendarReminders(appState) {
  const groups = {}

  for (const med of appState.meds) {
    for (const timing of med.timings) {
      if (!groups[timing]) {
        groups[timing] = {
          timing,
          meds: [],
          startDate: med.startDate || todayStr(),
          hasLongTerm: false,
          endDate: null
        }
      }
      const g = groups[timing]
      g.medSet = g.medSet || new Set()
      if (!g.medSet.has(med.id)) {
        g.medSet.add(med.id)
        g.meds.push(med)
      }
      const sd = med.startDate || todayStr()
      if (sd < g.startDate) g.startDate = sd
      if (med.longTerm) {
        g.hasLongTerm = true
      } else {
        const end = medEndDate(med)
        if (!g.endDate || end > g.endDate) g.endDate = end
      }
    }
  }

  return TIMING_SLOTS.filter((t) => groups[t]).map((timing) => {
    const g = groups[timing]
    const { hour, minute } = TIMING_DEFAULT_TIMES[timing] || { hour: 9, minute: 0 }
    const startDate = g.startDate || todayStr()
    const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    const medSummary = g.meds.map((m) => `${m.name}`).join('、')

    const reminder = {
      timing,
      timeLabel,
      title: `🌱 ${CALENDAR_SEARCH_KEYWORD}（${timing}）`,
      description: [
        `${appState.nickname || '您'}，打开「长青伙伴」给今天的小树浇浇水吧～`,
        `吃完${timing}的药记得点一下「浇水」哦。`,
        medSummary ? `本次：${medSummary}` : ''
      ].filter(Boolean).join('\n'),
      startTime: unixAt(startDate, hour, minute),
      repeatEndTime: g.hasLongTerm ? null : unixAt(g.endDate, hour, minute)
    }
    return reminder
  })
}

/** 是否支持写入手机日历（微信小程序真机；H5 预览不支持） */
export function isCalendarApiAvailable() {
  return typeof uni !== 'undefined' && typeof uni.addPhoneRepeatCalendar === 'function'
}

function addOneReminder(task) {
  return new Promise((resolve) => {
    const opts = {
      title: task.title,
      description: task.description,
      startTime: task.startTime,
      alarm: true,
      alarmOffset: 0,
      repeatInterval: 'day',
      success: () => resolve({ ok: true }),
      fail: (err) => resolve({ ok: false, err })
    }
    if (task.repeatEndTime) opts.repeatEndTime = task.repeatEndTime
    uni.addPhoneRepeatCalendar(opts)
  })
}

/**
 * 同步所有提醒到手机日历
 * @returns {{ ok, reason?, success?, failed?, total?, tasks? }}
 */
export async function syncCalendarReminders(appState) {
  const tasks = buildCalendarReminders(appState)
  if (tasks.length === 0) {
    return { ok: false, reason: 'empty', tasks: [] }
  }

  if (!isCalendarApiAvailable()) {
    return { ok: false, reason: 'unsupported', tasks }
  }

  let success = 0
  let failed = 0
  for (const task of tasks) {
    const res = await addOneReminder(task)
    if (res.ok) success++
    else failed++
  }

  return {
    ok: failed === 0,
    reason: failed ? 'partial' : 'done',
    success,
    failed,
    total: tasks.length,
    tasks
  }
}

/** 生成用药计划指纹，用于判断是否需要重新同步 */
export function getPlanHash(appState) {
  return JSON.stringify(
    appState.meds.map((m) => ({
      id: m.id,
      name: m.name,
      timings: m.timings,
      startDate: m.startDate,
      longTerm: m.longTerm,
      durationDays: m.durationDays
    }))
  )
}

/** 预览文案：H5 或未授权时展示 */
export function formatReminderPreview(tasks) {
  if (!tasks.length) return '还没有需要提醒的用药计划'
  return tasks
    .map((t) => `• 每天 ${t.timeLabel} · ${t.title}`)
    .join('\n')
}
