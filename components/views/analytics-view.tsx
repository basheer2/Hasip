"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Target, TrendingUp, CalendarDays, Award, Users, Briefcase, BarChart3 } from "lucide-react"
import {
  useWorkdays,
  useTransactions,
  useProjects,
  useContractors,
  useSettings,
} from "@/lib/use-data"
import {
  monthlySeries,
  cumulativeSeries,
  bestMonth,
  avgPerWorkday,
  avgPerMonth,
  weekdayDistribution,
  workTypeDistribution,
  partySummaries,
  earnedInMonth,
  currentMonthKey,
  goalProgress,
  type PartySummary,
} from "@/lib/analytics"
import { WORK_TYPE_LABELS } from "@/lib/types"
import { formatCurrency, formatNumber } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="font-bold text-primary">
        {formatCurrency(payload[0].value, currency)}
      </p>
    </div>
  )
}

export function AnalyticsView() {
  const workdays = useWorkdays()
  const transactions = useTransactions()
  const projects = useProjects()
  const contractors = useContractors()
  const settings = useSettings()
  const currency = settings?.currency ?? "ريال"

  const monthSeries = useMemo(() => monthlySeries(workdays, 12), [workdays])
  const cumSeries = useMemo(() => cumulativeSeries(workdays, 12), [workdays])
  const best = useMemo(() => bestMonth(workdays), [workdays])
  const avgDay = useMemo(() => avgPerWorkday(workdays), [workdays])
  const avgMonth = useMemo(() => avgPerMonth(workdays), [workdays])
  const weekdays = useMemo(() => weekdayDistribution(workdays), [workdays])
  const types = useMemo(() => workTypeDistribution(workdays), [workdays])
  const byContractor = useMemo(
    () =>
      partySummaries(workdays, transactions, contractors, (x) =>
        "contractorId" in x ? x.contractorId : null,
      ),
    [workdays, transactions, contractors],
  )
  const byProject = useMemo(
    () => partySummaries(workdays, transactions, projects, (x) => ("projectId" in x ? x.projectId : null)),
    [workdays, transactions, projects],
  )

  const goal = settings?.monthlyGoal ?? 0
  const monthKey = currentMonthKey()
  const earnedThisMonth = earnedInMonth(workdays, monthKey)
  const progress = goal > 0 ? Math.min(1, earnedThisMonth / goal) : 0
  const maxTypeCount = Math.max(1, ...types.map((t) => t.count))
  const maxWeekdayCount = Math.max(1, ...weekdays.map((w) => w.count))

  if (workdays.length === 0 && transactions.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="لا توجد بيانات للتحليل بعد"
        description="أضف أيام عمل أو عمليات مالية وستظهر هنا التحليلات والإحصائيات."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* الهدف الشهري */}
      {goal > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-card-foreground">الهدف الشهري</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(earnedThisMonth, currency)} من {formatCurrency(goal, currency)}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "text-xl font-extrabold",
                  progress >= 1 ? "text-success" : "text-primary",
                )}
              >
                {formatNumber(Math.round(progress * 100))}%
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progress >= 1 ? "bg-success" : "bg-primary",
                )}
                style={{ width: `${Math.max(2, progress * 100)}%` }}
              />
            </div>
            {progress >= 1 && (
              <p className="mt-2 text-sm font-medium text-success">
                🎉 حققت هدفك الشهري — أحسنت!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* إحصائيات */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox
          icon={TrendingUp}
          label="متوسط يوم العمل"
          value={formatCurrency(avgDay, currency)}
        />
        <StatBox
          icon={CalendarDays}
          label="متوسط الشهر"
          value={formatCurrency(avgMonth, currency)}
        />
        <StatBox
          icon={Award}
          label="أفضل شهر"
          value={best ? formatCurrency(best.value, currency) : "—"}
          sub={best?.label}
        />
        <StatBox
          icon={Target}
          label="إيراد الشهر الحالي"
          value={formatCurrency(earnedThisMonth, currency)}
        />
      </div>

      {/* الإيراد الشهري */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الإيراد الشهري (آخر 12 شهر)</CardTitle>
        </CardHeader>
        <CardContent>
          <div dir="ltr" className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthSeries} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  width={44}
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 h-px w-full bg-muted" />
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumSeries} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  width={44}
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#cumGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            الإيراد التراكمي (المجموع المتراكم عبر الشهور)
          </p>
        </CardContent>
      </Card>

      {/* توزيع أيام الأسبوع وأنواع العمل */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أيام الأسبوع الأكثر عملًا</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {weekdays.map((w) => (
              <div key={w.name} className="flex items-center gap-3">
                <p className="w-16 shrink-0 text-sm text-card-foreground">{w.name}</p>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${(w.count / maxWeekdayCount) * 100}%` }}
                  />
                </div>
                <p className="w-8 shrink-0 text-left text-sm font-bold text-card-foreground">
                  {formatNumber(w.count)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع أنواع العمل</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {types.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">لا توجد أيام عمل</p>
            ) : (
              types.map((t) => (
                <div key={t.type} className="flex items-center gap-3">
                  <p className="w-28 shrink-0 truncate text-sm text-card-foreground">
                    {WORK_TYPE_LABELS[t.type as keyof typeof WORK_TYPE_LABELS]}
                  </p>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success/80"
                      style={{ width: `${(t.count / maxTypeCount) * 100}%` }}
                    />
                  </div>
                  <p className="w-8 shrink-0 text-left text-sm font-bold text-card-foreground">
                    {formatNumber(t.count)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* حسب المقاول */}
      <PartyCard
        title="الأداء حسب المقاول"
        icon={Users}
        rows={byContractor}
        currency={currency}
        emptyText="لا توجد بيانات مرتبطة بمقاولين"
      />

      {/* حسب المشروع */}
      <PartyCard
        title="الأداء حسب المشروع"
        icon={Briefcase}
        rows={byProject}
        currency={currency}
        emptyText="لا توجد بيانات مرتبطة بمشاريع"
      />
    </div>
  )
}

function StatBox({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Target
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <span className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </span>
      <p className="truncate text-sm font-extrabold text-card-foreground">{value}</p>
      <p className="truncate text-xs text-muted-foreground">
        {label}
        {sub ? ` · ${sub}` : ""}
      </p>
    </div>
  )
}

function PartyCard({
  title,
  icon: Icon,
  rows,
  currency,
  emptyText,
}: {
  title: string
  icon: typeof Users
  rows: PartySummary[]
  currency: string
  emptyText: string
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="size-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
        </CardContent>
      </Card>
    )
  }
  const totals = rows.reduce(
    (acc, r) => ({
      earned: acc.earned + r.earned,
      paid: acc.paid + r.paid,
      remaining: acc.remaining + r.remaining,
    }),
    { earned: 0, paid: 0, remaining: 0 },
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="size-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
          <p>الاسم</p>
          <p className="text-left">أيام</p>
          <p className="text-left">المستحق</p>
          <p className="text-left">المتبقي</p>
        </div>
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-4 items-center gap-2 rounded-xl border bg-card px-3 py-2.5"
          >
            <p className="truncate text-sm font-semibold text-card-foreground">{r.name}</p>
            <p className="text-left text-sm text-muted-foreground">{formatNumber(r.workdays)}</p>
            <p className="text-left text-sm font-bold text-card-foreground">
              {formatNumber(r.earned)}
            </p>
            <p
              className={cn(
                "text-left text-sm font-bold",
                r.remaining >= 0 ? "text-success" : "text-negative",
              )}
            >
              {formatNumber(r.remaining)}
            </p>
          </div>
        ))}
        <div className="grid grid-cols-4 items-center gap-2 border-t px-3 pt-2 text-sm font-extrabold text-card-foreground">
          <p>الإجمالي</p>
          <p className="text-left">{formatNumber(rows.reduce((s, r) => s + r.workdays, 0))}</p>
          <p className="text-left">{formatNumber(totals.earned)}</p>
          <p className={cn("text-left", totals.remaining >= 0 ? "text-success" : "text-negative")}>
            {formatNumber(totals.remaining)}
          </p>
        </div>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          بالقيمة الاسمية {currency} — بدون علامة العملة للاختصار
        </p>
      </CardContent>
    </Card>
  )
}
