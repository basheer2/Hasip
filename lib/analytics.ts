import { workDayValue, computeTotals } from "./calc"
import type { WorkDay, Project, Contractor } from "./types"

export const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
]

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7) // yyyy-mm
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number)
  if (!y || !m) return key
  return `${AR_MONTHS[m - 1]} ${y}`
}

// إجمالي قيمة العمل في شهر معيّن
export function earnedInMonth(workdays: WorkDay[], key: string): number {
  return workdays
    .filter((w) => monthKey(w.date) === key)
    .reduce((s, w) => s + workDayValue(w), 0)
}

export function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// السلسلة الشهرية لآخر N شهر (حتى الشهر الحالي)
export function monthlySeries(workdays: WorkDay[], months = 12) {
  const now = new Date()
  const out: { key: string; label: string; value: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    out.push({ key, label: monthLabel(key), value: earnedInMonth(workdays, key) })
  }
  return out
}

// السلسلة التراكمية (الإيراد المتراكم عبر الشهور)
export function cumulativeSeries(workdays: WorkDay[], months = 12) {
  const series = monthlySeries(workdays, months)
  let acc = 0
  return series.map((s) => {
    acc += s.value
    return { ...s, value: acc }
  })
}

export function bestMonth(workdays: WorkDay[]) {
  const map = new Map<string, number>()
  for (const w of workdays) {
    const k = monthKey(w.date)
    map.set(k, (map.get(k) ?? 0) + workDayValue(w))
  }
  let best: { key: string; value: number } | null = null
  for (const [k, v] of map) {
    if (!best || v > best.value) best = { key: k, value: v }
  }
  return best ? { ...best, label: monthLabel(best.key) } : null
}

// متوسط قيمة يوم العمل (فقط الأيام التي يوجد فيها عمل)
export function avgPerWorkday(workdays: WorkDay[]): number {
  if (workdays.length === 0) return 0
  return workdays.reduce((s, w) => s + workDayValue(w), 0) / workdays.length
}

// متوسط الإيراد الشهري (عدد الشهور التي بها عمل)
export function avgPerMonth(workdays: WorkDay[]): number {
  const months = new Set(workdays.map((w) => monthKey(w.date)))
  if (months.size === 0) return 0
  return workdays.reduce((s, w) => s + workDayValue(w), 0) / months.size
}

// توزيع أيام الأسبوع
export function weekdayDistribution(workdays: WorkDay[]) {
  const names = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
  const counts = new Array(7).fill(0)
  for (const w of workdays) {
    const day = new Date(w.date + "T00:00:00").getDay()
    counts[day] += 1
  }
  return names.map((name, i) => ({ name, count: counts[i], value: counts[i] }))
}

// توزيع أنواع العمل
export function workTypeDistribution(workdays: WorkDay[]) {
  const map = new Map<string, number>()
  for (const w of workdays) map.set(w.type, (map.get(w.type) ?? 0) + 1)
  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

export interface PartySummary {
  id?: number
  name: string
  workdays: number
  earned: number
  received: number
  withdrawn: number
  paid: number
  remaining: number
}

export function partySummaries(
  workdays: WorkDay[],
  transactions: Transaction[],
  parties: (Project | Contractor)[],
  getPartyId: (w: WorkDay | Transaction) => number | null | undefined,
): PartySummary[] {
  return parties
    .map((p) => {
      const wd = workdays.filter((w) => getPartyId(w) === p.id)
      const tx = transactions.filter((t) => getPartyId(t) === p.id)
      const t = computeTotals(wd, tx)
      return {
        id: p.id,
        name: p.name,
        workdays: wd.length,
        earned: t.totalEarned,
        received: t.totalReceived,
        withdrawn: t.totalWithdrawn,
        paid: t.totalPaid,
        remaining: t.remaining,
      }
    })
    .filter((s) => s.workdays > 0 || s.paid > 0)
    .sort((a, b) => b.earned - a.earned)
}

// تقدم الهدف الشهري (0..1)
export function goalProgress(workdays: WorkDay[], goal: number): number {
  if (goal <= 0) return 0
  const earned = earnedInMonth(workdays, currentMonthKey())
  return Math.min(1, earned / goal)
}
