const WEEKDAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
]

export function weekdayName(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00")
  return WEEKDAYS[d.getDay()] ?? ""
}

export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 2,
  }).format(n || 0)
}

export function formatCurrency(n: number, currency: string): string {
  return `${formatNumber(n)} ${currency}`
}

export function formatDate(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00")
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

export function formatDateLong(dateISO: string): string {
  return `${formatDate(dateISO)} - ${weekdayName(dateISO)}`
}

// Range helpers
export function startOfWeek(d: Date): Date {
  // الأسبوع يبدأ السبت
  const day = d.getDay() // 0 Sun ... 6 Sat
  const diff = (day + 1) % 7 // كم يوم منذ السبت
  const res = new Date(d)
  res.setDate(d.getDate() - diff)
  res.setHours(0, 0, 0, 0)
  return res
}

export function isoOf(d: Date): string {
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}
