"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { CalendarDays, Plus, Pencil, Trash2, Zap } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/db"
import { useWorkdays, useProjects, useContractors, useSettings } from "@/lib/use-data"
import { workDayValue, hasOvertime } from "@/lib/calc"
import { weekdayName, formatDate, formatCurrency, formatNumber, todayISO } from "@/lib/format"
import { WORK_TYPE_LABELS, type WorkType, type WorkDay } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const WORK_TYPES = Object.keys(WORK_TYPE_LABELS) as WorkType[]

export function WorkdaysView() {
  const workdays = useWorkdays()
  const projects = useProjects()
  const contractors = useContractors()
  const settings = useSettings()
  const currency = settings?.currency ?? "ريال"

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WorkDay | null>(null)

  function openNew() {
    setEditing(null)
    setOpen(true)
  }
  function openEdit(w: WorkDay) {
    setEditing(w)
    setOpen(true)
  }

  async function remove(id?: number) {
    if (!id) return
    if (!confirm("هل تريد حذف يوم العمل هذا؟")) return
    await db.workdays.delete(id)
    toast.success("تم حذف يوم العمل")
  }

  const grouped = useMemo(() => {
    const m = new Map<string, WorkDay[]>()
    for (const w of workdays) {
      const d = new Date(w.date + "T00:00:00")
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const arr = m.get(key) ?? []
      arr.push(w)
      m.set(key, arr)
    }
    return Array.from(m.entries())
  }, [workdays])

  return (
    <div className="space-y-4">
      <Button className="h-11 w-full rounded-xl" onClick={openNew}>
        <Plus className="size-4" />
        إضافة يوم عمل
      </Button>

      {workdays.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="لا توجد أيام عمل مسجلة"
          description="اضغط على زر الإضافة لتسجيل أول يوم عمل."
        />
      ) : (
        grouped.map(([key, days]) => {
          const [y, mo] = key.split("-")
          const monthName = new Intl.DateTimeFormat("ar-EG", {
            month: "long",
            year: "numeric",
          }).format(new Date(Number(y), Number(mo) - 1, 1))
          const monthTotal = days.reduce((s, w) => s + workDayValue(w), 0)
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-muted-foreground">
                  {monthName}
                </h3>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(monthTotal, currency)}
                </span>
              </div>
              {days.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
                >
                  <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="text-base font-bold leading-none">
                      {new Date(w.date + "T00:00:00").getDate()}
                    </span>
                    <span className="mt-0.5 text-[10px] leading-none">
                      {weekdayName(w.date)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-card-foreground">
                        {WORK_TYPE_LABELS[w.type]}
                      </span>
                      {hasOvertime(w.type) ? (
                        <Badge variant="secondary" className="gap-1 px-1.5 text-[10px]">
                          <Zap className="size-3" />
                          {formatNumber(w.overtimeAmount)}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(w.date)} · يومية {formatNumber(w.dailyRate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-foreground">
                    {formatNumber(workDayValue(w))}
                  </span>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => openEdit(w)}
                      aria-label="تعديل"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive"
                      onClick={() => remove(w.id)}
                      aria-label="حذف"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        })
      )}

      {open ? (
        <WorkdayDialog
          key={editing?.id ?? "new"}
          editing={editing}
          projects={projects}
          contractors={contractors}
          defaultRate={settings?.defaultDailyRate ?? 10000}
          defaultOvertime={settings?.defaultOvertimeRate ?? 5000}
          currency={currency}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

function WorkdayDialog({
  editing,
  projects,
  contractors,
  defaultRate,
  defaultOvertime,
  currency,
  onClose,
}: {
  editing: WorkDay | null
  projects: { id?: number; name: string; dailyRate: number; overtimeRate: number }[]
  contractors: { id?: number; name: string }[]
  defaultRate: number
  defaultOvertime: number
  currency: string
  onClose: () => void
}) {
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [type, setType] = useState<WorkType>(editing?.type ?? "full")
  const [dailyRate, setDailyRate] = useState(String(editing?.dailyRate ?? defaultRate))
  const [overtimeAmount, setOvertimeAmount] = useState(
    String(editing?.overtimeAmount ?? defaultOvertime),
  )
  const [projectId, setProjectId] = useState<string>(
    editing?.projectId ? String(editing.projectId) : "none",
  )
  const [contractorId, setContractorId] = useState<string>(
    editing?.contractorId ? String(editing.contractorId) : "none",
  )
  const [notes, setNotes] = useState(editing?.notes ?? "")

  const showOvertime = hasOvertime(type)

  function onProjectChange(val: string) {
    setProjectId(val)
    const p = projects.find((x) => String(x.id) === val)
    if (p) {
      setDailyRate(String(p.dailyRate))
      if (p.overtimeRate) setOvertimeAmount(String(p.overtimeRate))
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const now = Date.now()
    const rate = Number(dailyRate) || 0
    const ot = showOvertime ? Number(overtimeAmount) || 0 : 0
    const payload: WorkDay = {
      date,
      type,
      dailyRate: rate,
      overtimeAmount: ot,
      projectId: projectId === "none" ? null : Number(projectId),
      contractorId: contractorId === "none" ? null : Number(contractorId),
      notes: notes.trim(),
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    }
    if (editing?.id) {
      await db.workdays.update(editing.id, payload)
      toast.success("تم تعديل يوم العمل")
    } else {
      await db.workdays.add(payload)
      toast.success("تمت إضافة يوم العمل")
    }
    onClose()
  }

  const preview =
    (type === "half" || type === "half_overtime" ? Number(dailyRate) * 0.5 : type === "overtime" ? 0 : Number(dailyRate)) +
    (showOvertime ? Number(overtimeAmount) || 0 : 0)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل يوم العمل" : "إضافة يوم عمل"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wd-date">التاريخ</Label>
            <Input
              id="wd-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              اليوم: <span className="font-medium text-foreground">{weekdayName(date)}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>نوع العمل</Label>
            <Select value={type} onValueChange={(v) => setType(v as WorkType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {WORK_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wd-rate">قيمة اليومية</Label>
              <Input
                id="wd-rate"
                type="number"
                inputMode="numeric"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
              />
            </div>
            {showOvertime ? (
              <div className="space-y-1.5">
                <Label htmlFor="wd-ot">قيمة الإضافي</Label>
                <Input
                  id="wd-ot"
                  type="number"
                  inputMode="numeric"
                  value={overtimeAmount}
                  onChange={(e) => setOvertimeAmount(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>المشروع</Label>
              <Select value={projectId} onValueChange={onProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="بدون" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>المقاول</Label>
              <Select value={contractorId} onValueChange={setContractorId}>
                <SelectTrigger>
                  <SelectValue placeholder="بدون" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون</SelectItem>
                  {contractors.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wd-notes">ملاحظات</Label>
            <Textarea
              id="wd-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="اختياري"
            />
          </div>

          <div className="rounded-xl bg-primary/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">قيمة اليوم المحسوبة</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(preview, currency)}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit">{editing ? "حفظ التعديل" : "إضافة"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
