"use client"

import { useMemo, useState } from "react"
import { useWorkdays, useTransactions, useSettings } from "@/lib/use-data"
import { computeTotals, workDayValue } from "@/lib/calc"
import { WORK_TYPE_LABELS } from "@/lib/types"
import type { WorkDay } from "@/lib/types"
import { formatCurrency, formatDate, todayISO, startOfWeek, isoOf } from "@/lib/format"
import { generateReportPdf } from "@/lib/pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download } from "lucide-react"
import { toast } from "sonner"

type Period = "daily" | "weekly" | "monthly" | "custom"

function withinRange(dateISO: string, from: string, to: string): boolean {
  return dateISO >= from && dateISO <= to
}

export function ReportsView() {
  const workdays = useWorkdays()
  const transactions = useTransactions()
  const settings = useSettings()
  const [period, setPeriod] = useState<Period>("monthly")
  const today = todayISO()
  const [anchorDate, setAnchorDate] = useState(today)
  const [customFrom, setCustomFrom] = useState(today.slice(0, 8) + "01")
  const [customTo, setCustomTo] = useState(today)

  const { from, to } = useMemo(() => {
    if (period === "custom") return { from: customFrom, to: customTo }
    const anchor = new Date(anchorDate + "T00:00:00")
    if (period === "daily") return { from: anchorDate, to: anchorDate }
    if (period === "weekly") {
      const s = startOfWeek(anchor)
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      return { from: isoOf(s), to: isoOf(e) }
    }
    // monthly
    const s = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const e = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    return { from: isoOf(s), to: isoOf(e) }
  }, [period, anchorDate, customFrom, customTo])

  const rangedWorkdays = useMemo(
    () => workdays.filter((w) => withinRange(w.date, from, to)),
    [workdays, from, to],
  )
  const rangedTx = useMemo(
    () => transactions.filter((t) => withinRange(t.date, from, to)),
    [transactions, from, to],
  )

  const totals = useMemo(() => computeTotals(rangedWorkdays, rangedTx), [rangedWorkdays, rangedTx])

  const currency = settings.currency
  const rangeLabel = `${formatDate(from)} — ${formatDate(to)}`

  const handleExport = () => {
    try {
      generateReportPdf({
        title: "تقرير الحساب",
        systemName: settings.systemName,
        userName: settings.userName,
        rangeLabel,
        currency,
        totals,
        workdays: rangedWorkdays,
      })
      toast.success("تم إنشاء ملف PDF")
    } catch (e) {
      console.log("[v0] pdf error", e)
      toast.error("تعذّر إنشاء الملف")
    }
  }

  const rows: { label: string; value: string; tone?: "due" | "paid" | "remaining" }[] = [
    { label: "عدد أيام العمل", value: String(totals.workDaysCount) },
    { label: "الأيام الكاملة", value: String(totals.fullDaysCount) },
    { label: "أنصاف الأيام", value: String(totals.halfDaysCount) },
    { label: "إجمالي الإضافي", value: formatCurrency(totals.overtimeTotal, currency) },
    { label: "إجمالي المستحق", value: formatCurrency(totals.totalEarned, currency), tone: "due" },
    { label: "إجمالي المدفوع", value: formatCurrency(totals.totalPaid, currency), tone: "paid" },
    { label: "المتبقي", value: formatCurrency(totals.remaining, currency), tone: "remaining" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التقارير</h1>
          <p className="text-sm text-muted-foreground">استعرض حسابك حسب الفترة واستخرج كشف PDF</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="size-4" />
          تصدير PDF
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">يومي</TabsTrigger>
              <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
              <TabsTrigger value="monthly">شهري</TabsTrigger>
              <TabsTrigger value="custom">فترة</TabsTrigger>
            </TabsList>
          </Tabs>

          {period === "custom" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="from">من تاريخ</Label>
                <Input id="from" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="to">إلى تاريخ</Label>
                <Input id="to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="anchor">التاريخ المرجعي</Label>
              <Input id="anchor" type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} />
            </div>
          )}

          <p className="text-center text-sm font-medium text-muted-foreground">{rangeLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-primary" />
            ملخص الفترة
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 p-0 pb-2">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-6 py-3 ${i % 2 === 0 ? "bg-muted/40" : ""}`}
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  row.tone === "due"
                    ? "text-primary"
                    : row.tone === "paid"
                      ? "text-positive"
                      : row.tone === "remaining"
                        ? "text-warning"
                        : "text-foreground"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {rangedWorkdays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل أيام العمل ({rangedWorkdays.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-0 pb-2">
            {rangedWorkdays
              .slice()
              .sort((a: WorkDay, b: WorkDay) => a.date.localeCompare(b.date))
              .map((w, i) => (
                <div
                  key={w.id}
                  className={`flex items-center justify-between px-6 py-3 ${i % 2 === 0 ? "bg-muted/40" : ""}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{formatDate(w.date)}</span>
                    <span className="text-xs text-muted-foreground">{WORK_TYPE_LABELS[w.type]}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(workDayValue(w), currency)}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
