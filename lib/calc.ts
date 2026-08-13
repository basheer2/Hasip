import type { WorkDay, Transaction, WorkType } from "./types"

// قيمة يوم العمل (أساسي + إضافي)
export function workDayValue(w: WorkDay): number {
  return workDayBase(w) + (hasOvertime(w.type) ? w.overtimeAmount || 0 : 0)
}

// القيمة الأساسية بدون الإضافي
export function workDayBase(w: WorkDay): number {
  const factor = dayFactor(w.type)
  return w.dailyRate * factor
}

export function dayFactor(type: WorkType): number {
  switch (type) {
    case "full":
    case "full_overtime":
      return 1
    case "half":
    case "half_overtime":
      return 0.5
    case "overtime":
      return 0
  }
}

export function hasOvertime(type: WorkType): boolean {
  return type === "overtime" || type === "full_overtime" || type === "half_overtime"
}

export function isFullDay(type: WorkType): boolean {
  return type === "full" || type === "full_overtime"
}

export function isHalfDay(type: WorkType): boolean {
  return type === "half" || type === "half_overtime"
}

export interface Totals {
  totalEarned: number // إجمالي قيمة العمل (مستحق)
  totalReceived: number // المبالغ المستلمة
  totalWithdrawn: number // المبالغ المسحوبة
  totalPaid: number // المدفوع = مستلم + مسحوب
  remaining: number // المتبقي
  workDaysCount: number
  fullDaysCount: number
  halfDaysCount: number
  overtimeTotal: number
  baseTotal: number
}

export function computeTotals(
  workdays: WorkDay[],
  transactions: Transaction[],
): Totals {
  let totalEarned = 0
  let overtimeTotal = 0
  let baseTotal = 0
  let fullDaysCount = 0
  let halfDaysCount = 0

  for (const w of workdays) {
    totalEarned += workDayValue(w)
    baseTotal += workDayBase(w)
    if (hasOvertime(w.type)) overtimeTotal += w.overtimeAmount || 0
    if (isFullDay(w.type)) fullDaysCount += 1
    if (isHalfDay(w.type)) halfDaysCount += 1
  }

  let totalReceived = 0
  let totalWithdrawn = 0
  for (const t of transactions) {
    if (t.type === "received") totalReceived += t.amount
    else totalWithdrawn += t.amount
  }

  const totalPaid = totalReceived + totalWithdrawn
  return {
    totalEarned,
    totalReceived,
    totalWithdrawn,
    totalPaid,
    remaining: totalEarned - totalPaid,
    workDaysCount: workdays.length,
    fullDaysCount,
    halfDaysCount,
    overtimeTotal,
    baseTotal,
  }
}
