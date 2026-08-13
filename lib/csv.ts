import { saveFile } from "./native"

function escapeCell(value: string | number): string {
  const s = String(value ?? "")
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// تصدير صفوف إلى ملف CSV (بترميز UTF-8 مع BOM ليدعمه Excel بالعربية)
export async function exportCsv(filename: string, headers: string[], rows: (string | number)[][]): Promise<void> {
  const lines = [headers.map(escapeCell).join(",")]
  for (const row of rows) lines.push(row.map(escapeCell).join(","))
  const csv = "\uFEFF" + lines.join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  await saveFile(filename, blob)
}
