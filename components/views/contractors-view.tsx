"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Users, Plus, Pencil, Trash2, Phone, Building2, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/db"
import {
  useContractors,
  useProjects,
  useWorkdays,
  useTransactions,
  useSettings,
} from "@/lib/use-data"
import { computeTotals } from "@/lib/calc"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { Contractor } from "@/lib/types"
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

export function ContractorsView() {
  const contractors = useContractors()
  const projects = useProjects()
  const workdays = useWorkdays()
  const transactions = useTransactions()
  const settings = useSettings()
  const currency = settings?.currency ?? "ريال"

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contractor | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  const statsFor = (id: number) => {
    const wd = workdays.filter((w) => w.contractorId === id)
    const tx = transactions.filter((t) => t.contractorId === id)
    return computeTotals(wd, tx)
  }

  async function remove(id?: number) {
    if (!id) return
    if (!confirm("حذف المقاول؟")) return
    await db.contractors.delete(id)
    toast.success("تم حذف المقاول")
    setDetailId(null)
  }

  if (detailId != null) {
    const c = contractors.find((x) => x.id === detailId)
    if (!c) {
      setDetailId(null)
      return null
    }
    const totals = statsFor(detailId)
    const relatedProjects = projects.filter((p) => p.contractorId === detailId)
    return (
      <div className="space-y-4">
        <button
          className="flex items-center gap-1 text-sm font-medium text-primary"
          onClick={() => setDetailId(null)}
        >
          <ChevronLeft className="size-4" />
          رجوع للقائمة
        </button>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-bold text-card-foreground">{c.name}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {c.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" />
                {c.phone}
              </span>
            ) : null}
            {c.company ? (
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5" />
                {c.company}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border bg-card p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">المستحقات</p>
            <p className="mt-1 text-base font-bold text-foreground">
              {formatNumber(totals.totalEarned)}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">المدفوع</p>
            <p className="mt-1 text-base font-bold text-success">
              {formatNumber(totals.totalPaid)}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">المتبقي</p>
            <p className="mt-1 text-base font-bold text-primary">
              {formatNumber(totals.remaining)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 font-bold text-card-foreground">
            المشاريع المرتبطة ({relatedProjects.length})
          </h3>
          {relatedProjects.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              لا توجد مشاريع مرتبطة
            </p>
          ) : (
            <ul className="divide-y">
              {relatedProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-card-foreground">
                    {p.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.location}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {c.notes ? (
          <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground shadow-sm">
            {c.notes}
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setEditing(c)
              setOpen(true)
            }}
          >
            <Pencil className="size-4" />
            تعديل
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-destructive"
            onClick={() => remove(c.id)}
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
        </div>

        {open ? (
          <ContractorDialog
            key={editing?.id ?? "edit"}
            editing={editing}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </div>
    )
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
        إضافة مقاول
      </Button>

      {contractors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد مقاولون"
          description="أضف المقاولين لمتابعة حساب كل واحد على حدة."
        />
      ) : (
        <div className="space-y-2">
          {contractors.map((c) => {
            const totals = statsFor(c.id!)
            return (
              <button
                key={c.id}
                onClick={() => setDetailId(c.id!)}
                className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-right shadow-sm transition-colors hover:bg-accent/50"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                  {c.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-card-foreground">
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    المتبقي: {formatCurrency(totals.remaining, currency)}
                  </p>
                </div>
                <ChevronLeft className="size-5 shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      )}

      {open ? (
        <ContractorDialog
          key={editing?.id ?? "new"}
          editing={editing}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

function ContractorDialog({
  editing,
  onClose,
}: {
  editing: Contractor | null
  onClose: () => void
}) {
  const [name, setName] = useState(editing?.name ?? "")
  const [phone, setPhone] = useState(editing?.phone ?? "")
  const [company, setCompany] = useState(editing?.company ?? "")
  const [notes, setNotes] = useState(editing?.notes ?? "")

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("أدخل اسم المقاول")
      return
    }
    const now = Date.now()
    const payload: Contractor = {
      name: name.trim(),
      phone: phone.trim(),
      company: company.trim(),
      notes: notes.trim(),
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    }
    if (editing?.id) {
      await db.contractors.update(editing.id, payload)
      toast.success("تم تعديل المقاول")
    } else {
      await db.contractors.add(payload)
      toast.success("تمت إضافة المقاول")
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل المقاول" : "إضافة مقاول"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-name">الاسم</Label>
            <Input
              id="ct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: محمد"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-phone">رقم الهاتف</Label>
            <Input
              id="ct-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-company">اسم الشركة</Label>
            <Input
              id="ct-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="اختياري"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-notes">ملاحظات</Label>
            <Textarea
              id="ct-notes"
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
