"use client"

import { useMemo } from "react"
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Sun,
  SunMedium,
  Zap,
  Plus,
} from "lucide-react"
import { useWorkdays, useTransactions, useSettings } from "@/lib/use-data"
import { computeTotals, workDayValue } from "@/lib/calc"
import { formatCurrency, formatNumber, isoOf, startOfWeek, formatDateLong } from "@/lib/format"
import { WORK_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/types"
import type { ViewKey } from "@/components/navigation"
import { StatCard } from "@/components/stat-card"
import { IncomeChart } from "@/components/income-chart"
import { PayComparison } from "@/components/pay-comparison"
import { Button } from "@/components/ui/button"

export function DashboardView({
  onNavigate,
}: {
  onNavigate: (v: ViewKey) => void
}) {
  const workdays = useWorkdays()
  const transactions = useTransactions()
  const settings = useSettings()
  const currency = settings?.currency ?? "ريال"

  const totals = useMemo(
    () => computeTotals(workdays, transactions),
    [workdays, transactions],
  )

  const periodTotals = useMemo(() => {
    const now = new Date()
    const todayStr = isoOf(now)
    const weekStart = isoOf(startOfWeek(now))
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

    let day = 0
    let week = 0
    let month = 0
    for (const w of workdays) {
      const v = workDayValue(w)
      if (w.date === todayStr) day += v
      if (w.date >= weekStart) week += v
      if (w.date >= monthStart) month += v
    }
    return { day, week, month }
  }, [workdays])

  const recent = useMemo(() => {
    const items: {
      id: string
      date: string
      title: string
      amount: number
      kind: "work" | "received" | "withdrawn"
    }[] = []
    for (const w of workdays) {
      items.push({
        id: `w${w.id}`,
        date: w.date,
        title: WORK_TYPE_LABELS[w.type],
        amount: workDayValue(w),
        kind: "work",
      })
    }
    for (const t of transactions) {
      items.push({
        id: `t${t.id}`,
        date: t.date,
        title: t.reason || TRANSACTION_TYPE_LABELS[t.type],
        amount: t.amount,
        kind: t.type,
      })
    }
    return items
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 6)
  }, [workdays, transactions])

  return (
    <div className="space-y-5">
      {/* Hero balance card */}
      <div className="rounded-3xl border bg-gradient-to-bl from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
        <p className="text-sm opacity-85">المبلغ المتبقي (المستحق لك)</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">
          {formatCurrency(totals.remaining, currency)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="opacity-85">إجمالي المستحق</p>
            <p className="mt-0.5 font-bold">
              {formatCurrency(totals.totalEarned, currency)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="opacity-85">إجمالي المدفوع</p>
            <p className="mt-0.5 font-bold">
              {formatCurrency(totals.totalPaid, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button
          className="h-11 flex-1 rounded-xl"
          onClick={() => onNavigate("workdays")}
        >
          <Plus className="size-4" />
          يوم عمل
        </Button>
        <Button
          variant="secondary"
          className="h-11 flex-1 rounded-xl"
          onClick={() => onNavigate("transactions")}
        >
          <Wallet className="size-4" />
          سحب / استلام
        </Button>
      </div>

      {/* Period income */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="اليوم"
          value={formatCurrency(periodTotals.day, currency)}
          icon={Sun}
          tone="info"
        />
        <StatCard
          label="الأسبوع"
          value={formatCurrency(periodTotals.week, currency)}
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          label="الشهر"
          value={formatCurrency(periodTotals.month, currency)}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      {/* Money stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="إجمالي قيمة العمل"
          value={formatCurrency(totals.totalEarned, currency)}
          icon={CircleDollarSign}
          tone="primary"
        />
        <StatCard
          label="المبالغ المستلمة"
          value={formatCurrency(totals.totalReceived, currency)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="المبالغ المسحوبة"
          value={formatCurrency(totals.totalWithdrawn, currency)}
          icon={TrendingDown}
          tone="warning"
        />
        <StatCard
          label="المتبقي"
          value={formatCurrency(totals.remaining, currency)}
          icon={Wallet}
          tone={totals.remaining >= 0 ? "info" : "destructive"}
        />
      </div>

      {/* Work stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="أيام العمل"
          value={formatNumber(totals.workDaysCount)}
          icon={CalendarDays}
          tone="muted"
        />
        <StatCard
          label="أيام كاملة"
          value={formatNumber(totals.fullDaysCount)}
          icon={Sun}
          tone="muted"
        />
        <StatCard
          label="أنصاف أيام"
          value={formatNumber(totals.halfDaysCount)}
          icon={SunMedium}
          tone="muted"
        />
        <StatCard
          label="إجمالي الإضافي"
          value={formatCurrency(totals.overtimeTotal, currency)}
          icon={Zap}
          tone="warning"
        />
      </div>

      {/* Charts */}
      <IncomeChart workdays={workdays} currency={currency} />
      <PayComparison totals={totals} currency={currency} />

      {/* Recent operations */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-card-foreground">آخر العمليات</h2>
          <button
            className="text-sm font-medium text-primary"
            onClick={() => onNavigate("records")}
          >
            عرض الكل
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا توجد عمليات بعد. ابدأ بإضافة يوم عمل.
          </p>
        ) : (
          <ul className="divide-y">
            {recent.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateLong(item.date)}
                  </p>
                </div>
                <span
                  className={
                    item.kind === "withdrawn"
                      ? "shrink-0 font-bold text-warning"
                      : item.kind === "received"
                        ? "shrink-0 font-bold text-success"
                        : "shrink-0 font-bold text-foreground"
                  }
                >
                  {item.kind === "work" ? "+" : item.kind === "received" ? "-" : "-"}
                  {formatNumber(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
