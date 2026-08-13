"use client"

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { Totals } from "@/lib/calc"
import { formatNumber } from "@/lib/format"

export function PayComparison({
  totals,
  currency,
}: {
  totals: Totals
  currency: string
}) {
  const data = [
    { label: "المستحق", value: totals.totalEarned, color: "var(--color-chart-1)" },
    { label: "المدفوع", value: totals.totalPaid, color: "var(--color-chart-2)" },
    {
      label: "المتبقي",
      value: totals.remaining,
      color: "var(--color-chart-3)",
    },
  ]

  const empty = totals.totalEarned === 0 && totals.totalPaid === 0

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <h2 className="mb-4 font-bold text-card-foreground">
        مقارنة: المستحق / المدفوع / المتبقي
      </h2>
      {empty ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          لا توجد بيانات لعرضها بعد
        </p>
      ) : (
        <div className="h-52 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
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
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--color-popover-foreground)",
                }}
                formatter={(value) => [
                  `${formatNumber(value as number)} ${currency}`,
                  "القيمة",
                ]}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
