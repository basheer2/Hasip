"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Briefcase, Plus, Pencil, Trash2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/db"
import {
  useProjects,
  useContractors,
  useWorkdays,
  useTransactions,
  useSettings,
} from "@/lib/use-data"
import { computeTotals } from "@/lib/calc"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { Project } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export function ProjectsView() {
  const projects = useProjects()
  const contractors = useContractors()
  const workdays = useWorkdays()
  const transactions = useTransactions()
  const settings = useSettings()
  const currency = settings?.currency ?? "ريال"

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const stats = useMemo(() => {
    const m = new Map<number, { earned: number; paid: number; days: number }>()
    for (const w of workdays) {
      if (!w.projectId) continue
      const t = computeTotals([w], [])
      const cur = m.get(w.projectId) ?? { earned: 0, paid: 0, days: 0 }
      cur.earned += t.totalEarned
      cur.days += 1
      m.set(w.projectId, cur)
    }
    for (const tr of transactions) {
      if (!tr.projectId) continue
      const cur = m.get(tr.projectId) ?? { earned: 0, paid: 0, days: 0 }
      cur.paid += tr.amount
      m.set(tr.projectId, cur)
    }
    return m
  }, [workdays, transactions])

  async function remove(id?: number) {
    if (!id) return
    if (!confirm("حذف المشروع؟ لن تُحذف أيام العمل المرتبطة.")) return
    await db.projects.delete(id)
    toast.success("تم حذف المشروع")
  }

  return (
    <div className="space-y-4">
      <Button
        className="h-11 w-full rounded-xl"
        onClick={() => {
          setEditing(null)
          setOpen(true)
        }}
      >
        <Plus className="size-4" />
        إضافة مشروع
      </Button>

      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="لا توجد مشاريع"
          description="أضف مشاريعك ومواقع العمل لربط أيام العمل بها."
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const s = stats.get(p.id!) ?? { earned: 0, paid: 0, days: 0 }
            const contractor = contractors.find((c) => c.id === p.contractorId)
            return (
              <div
                key={p.id}
                className="rounded-2xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-card-foreground">{p.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {p.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {p.location}
                        </span>
                      ) : null}
                      {contractor ? <span>المقاول: {contractor.name}</span> : null}
                      <span>يومية: {formatNumber(p.dailyRate)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => {
                        setEditing(p)
                        setOpen(true)
                      }}
                      aria-label="تعديل"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive"
                      onClick={() => remove(p.id)}
                      aria-label="حذف"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted p-2">
                    <p className="text-[11px] text-muted-foreground">المستحق</p>
                    <p className="text-sm font-bold text-foreground">
                      {formatNumber(s.earned)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted p-2">
                    <p className="text-[11px] text-muted-foreground">المدفوع</p>
                    <p className="text-sm font-bold text-success">
                      {formatNumber(s.paid)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted p-2">
                    <p className="text-[11px] text-muted-foreground">المتبقي</p>
                    <p className="text-sm font-bold text-primary">
                      {formatNumber(s.earned - s.paid)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {open ? (
        <ProjectDialog
          key={editing?.id ?? "new"}
          editing={editing}
          contractors={contractors}
          defaultRate={settings?.defaultDailyRate ?? 10000}
          defaultOvertime={settings?.defaultOvertimeRate ?? 5000}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

function ProjectDialog({
  editing,
  contractors,
  defaultRate,
  defaultOvertime,
  onClose,
}: {
  editing: Project | null
  contractors: { id?: number; name: string }[]
  defaultRate: number
  defaultOvertime: number
  onClose: () => void
}) {
  const [name, setName] = useState(editing?.name ?? "")
  const [location, setLocation] = useState(editing?.location ?? "")
  const [contractorId, setContractorId] = useState<string>(
    editing?.contractorId ? String(editing.contractorId) : "none",
  )
  const [dailyRate, setDailyRate] = useState(String(editing?.dailyRate ?? defaultRate))
  const [overtimeRate, setOvertimeRate] = useState(
    String(editing?.overtimeRate ?? defaultOvertime),
  )
  const [startDate, setStartDate] = useState(editing?.startDate ?? "")
  const [endDate, setEndDate] = useState(editing?.endDate ?? "")
  const [notes, setNotes] = useState(editing?.notes ?? "")

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("أدخل اسم المشروع")
      return
    }
    const now = Date.now()
    const payload: Project = {
      name: name.trim(),
      location: location.trim(),
      contractorId: contractorId === "none" ? null : Number(contractorId),
      dailyRate: Number(dailyRate) || 0,
      overtimeRate: Number(overtimeRate) || 0,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      notes: notes.trim(),
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    }
    if (editing?.id) {
      await db.projects.update(editing.id, payload)
      toast.success("تم تعديل المشروع")
    } else {
      await db.projects.add(payload)
      toast.success("تمت إضافة المشروع")
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل المشروع" : "إضافة مشروع"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pr-name">اسم المشروع</Label>
            <Input
              id="pr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: عمارة الجبري"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-loc">الموقع</Label>
            <Input
              id="pr-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثال: تعز"
            />
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pr-rate">قيمة اليومية</Label>
              <Input
                id="pr-rate"
                type="number"
                inputMode="numeric"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-ot">قيمة الإضافي</Label>
              <Input
                id="pr-ot"
                type="number"
                inputMode="numeric"
                value={overtimeRate}
                onChange={(e) => setOvertimeRate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pr-start">تاريخ البداية</Label>
              <Input
                id="pr-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-end">تاريخ النهاية</Label>
              <Input
                id="pr-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-notes">ملاحظات</Label>
            <Textarea
              id="pr-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
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
