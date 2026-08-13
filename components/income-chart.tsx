"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { WorkDay } from "@/lib/types"
import { workDayValue } from "@/lib/calc"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type Grouping = "day" | "week" | "month"

const LABELS: Record<Grouping, string> = {
  day: "يومي",
  week: "أسبوعي",
  month: "شهري",
}

const AR_MONTHS = [
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

export function IncomeChart({
  workdays,
  currency,
}: {
  workdays: WorkDay[]
  currency: string
}) {
  const [grouping, setGrouping] = useState<Grouping>("day")

  const data = useMemo(() => {
    const map = new Map<string, { key: string; label: string; value: number }>()
    for (const w of workdays) {
      const d = new Date(w.date + "T00:00:00")
      let key: string
      let label: string
      if (grouping === "day") {
        key = w.date
        label = `${d.getDate()}/${d.getMonth() + 1}`
      } else if (grouping === "week") {
        const onejan = new Date(d.getFullYear(), 0, 1)
        const week = Math.ceil(
          ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) /
            7,
        )
        key = `${d.getFullYear()}-w${String(week).padStart(2, "0")}`
        label = `أسبوع ${week}`
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        label = AR_MONTHS[d.getMonth()]
      }
      const cur = map.get(key) ?? { key, label, value: 0 }
      cur.value += workDayValue(w)
      map.set(key, cur)
    }
    return Array.from(map.values())
      .sort((a, b) => (a.key < b.key ? -1 : 1))
      .slice(-12)
  }, [workdays, grouping])

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold text-card-foreground">الدخل</h2>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {(["day", "week", "month"] as Grouping[]).map((g) => (
            <button
              key={g}
              onClick={() => setGrouping(g)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                grouping === g
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          لا توجد بيانات لعرضها بعد
        </p>
      ) : (
        <div className="h-56 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v) => formatNumber(v as number)}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-border)" }}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--color-popover-foreground)",
                }}
                formatter={(value) => [
                  `${formatNumber(value as number)} ${currency}`,
                  "الدخل",
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                fill="url(#incomeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
