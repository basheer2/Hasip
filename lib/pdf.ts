import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { workDayValue } from "@/lib/calc"
import type { Totals } from "@/lib/calc"
import type { WorkDay } from "@/lib/types"
import { WORK_TYPE_LABELS } from "@/lib/types"
import { formatCurrency, formatDate, todayISO } from "@/lib/format"
import { saveFile } from "@/lib/native"

// Reverse Arabic strings so jsPDF's LTR core fonts render them in the correct
// visual order. This is a pragmatic offline approach that avoids bundling a
// heavy Arabic font while keeping right-to-left reading order in the output.
function shape(text: string): string {
  return text
    .split("\n")
    .map((line) => line.split(" ").reverse().join(" "))
    .join("\n")
}

interface ReportData {
  title: string
  systemName: string
  userName: string
  rangeLabel: string
  currency: string
  totals: Totals
  workdays: WorkDay[]
}

export function generateReportPdf(data: ReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  doc.text(shape(data.title), pageWidth / 2, 20, { align: "center" })
  doc.setFontSize(11)
  doc.setTextColor(120)
  doc.text(shape(data.systemName), pageWidth / 2, 28, { align: "center" })
  doc.text(shape(data.rangeLabel), pageWidth / 2, 35, { align: "center" })
  if (data.userName) {
    doc.text(shape(`العامل: ${data.userName}`), pageWidth / 2, 42, { align: "center" })
  }
  doc.setTextColor(0)

  const t = data.totals
  const summaryRows: [string, string][] = [
    ["عدد أيام العمل", String(t.workDaysCount)],
    ["الأيام الكاملة", String(t.fullDaysCount)],
    ["أنصاف الأيام", String(t.halfDaysCount)],
    ["إجمالي الإضافي", formatCurrency(t.overtimeTotal, data.currency)],
    ["إجمالي المستحق", formatCurrency(t.totalEarned, data.currency)],
    ["إجمالي المستلم", formatCurrency(t.totalReceived, data.currency)],
    ["إجمالي المسحوب", formatCurrency(t.totalWithdrawn, data.currency)],
    ["إجمالي المدفوع", formatCurrency(t.totalPaid, data.currency)],
    ["المتبقي", formatCurrency(t.remaining, data.currency)],
  ]

  autoTable(doc, {
    startY: 50,
    head: [[shape("القيمة"), shape("البيان")]],
    body: summaryRows.map(([label, value]) => [shape(value), shape(label)]),
    theme: "grid",
    styles: { halign: "right", fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235], halign: "right" },
    columnStyles: { 0: { halign: "left" } },
  })

  if (data.workdays.length > 0) {
    const detailRows = data.workdays
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => [
        shape(formatCurrency(workDayValue(w), data.currency)),
        shape(WORK_TYPE_LABELS[w.type]),
        formatDate(w.date),
      ])

    autoTable(doc, {
      // @ts-expect-error lastAutoTable is added at runtime by the plugin
      startY: (doc.lastAutoTable?.finalY ?? 90) + 10,
      head: [[shape("القيمة"), shape("نوع العمل"), shape("التاريخ")]],
      body: detailRows,
      theme: "striped",
      styles: { halign: "right", fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], halign: "right" },
    })
  }

  void saveFile(`report-${todayISO()}.pdf`, doc.output("blob"))
}
