"use client"

import type React from "react"
import { useState } from "react"
import { Wallet, Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/db"
import { useTransactions, useProjects, useContractors, useSettings } from "@/lib/use-data"
import { formatDate, formatCurrency, formatNumber, todayISO, weekdayName } from "@/lib/format"
import {
  TRANSACTION_TYPE_LABELS,
  type TransactionType,
  type Transaction,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { recordActivity } from "@/lib/activity"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TransactionsView() {
  const transactions = useTransactions()
  const projects = useProjects()
  const contractors = useContractors()
  const settings = useSettings()
  const currency = settings?.currency ?? "ريال"

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [defaultType, setDefaultType] = useState<TransactionType>("received")

  function openNew(t: TransactionType) {
    setDefaultType(t)
    setEditing(null)
    setOpen(true)
  }

  async function remove(id?: number) {
    if (!id) return
    if (!confirm("هل تريد حذف هذه العملية؟")) return
    await db.transactions.delete(id)
    void recordActivity("transaction", "حذف عملية مالية")
    toast.success("تم الحذف")
  }

  const received = transactions
    .filter((t) => t.type === "received")
    .reduce((s, t) => s + t.amount, 0)
  const withdrawn = transactions
    .filter((t) => t.type === "withdrawn")
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-success">
            <TrendingUp className="size-4" />
            <span className="text-xs font-medium text-muted-foreground">
              المستلم
            </span>
          </div>
          <p className="text-lg font-bold text-card-foreground">
            {formatCurrency(received, currency)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-warning">
            <TrendingDown className="size-4" />
            <span className="text-xs font-medium text-muted-foreground">
              المسحوب
            </span>
          </div>
          <p className="text-lg font-bold text-card-foreground">
            {formatCurrency(withdrawn, currency)}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          className="h-11 flex-1 rounded-xl bg-success text-success-foreground hover:bg-success/90"
          onClick={() => openNew("received")}
        >
          <Plus className="size-4" />
          مبلغ مستلم
        </Button>
        <Button
          className="h-11 flex-1 rounded-xl bg-warning text-warning-foreground hover:bg-warning/90"
          onClick={() => openNew("withdrawn")}
        >
          <Plus className="size-4" />
          مبلغ مسحوب
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="لا توجد عمليات مالية"
          description="سجّل المبالغ المستلمة والمسحوبة لمتابعة حسابك."
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  t.type === "received"
                    ? "bg-success/15 text-success"
                    : "bg-warning/20 text-warning",
                )}
              >
                {t.type === "received" ? (
                  <TrendingUp className="size-5" />
                ) : (
                  <TrendingDown className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {t.reason || TRANSACTION_TYPE_LABELS[t.type]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(t.date)} · {weekdayName(t.date)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-bold",
                  t.type === "received" ? "text-success" : "text-warning",
                )}
              >
                {formatNumber(t.amount)}
              </span>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => {
                    setEditing(t)
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
                  onClick={() => remove(t.id)}
                  aria-label="حذف"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <TransactionDialog
          key={editing?.id ?? "new"}
          editing={editing}
          defaultType={defaultType}
          projects={projects}
          contractors={contractors}
          currency={currency}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

function TransactionDialog({
  editing,
  defaultType,
  projects,
  contractors,
  currency,
  onClose,
}: {
  editing: Transaction | null
  defaultType: TransactionType
  projects: { id?: number; name: string }[]
  contractors: { id?: number; name: string }[]
  currency: string
  onClose: () => void
}) {
  const [type, setType] = useState<TransactionType>(editing?.type ?? defaultType)
  const [amount, setAmount] = useState(String(editing?.amount ?? ""))
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [reason, setReason] = useState(editing?.reason ?? "")
  const [projectId, setProjectId] = useState<string>(
    editing?.projectId ? String(editing.projectId) : "none",
  )
  const [contractorId, setContractorId] = useState<string>(
    editing?.contractorId ? String(editing.contractorId) : "none",
  )
  const [notes, setNotes] = useState(editing?.notes ?? "")

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount) || 0
    if (amt <= 0) {
      toast.error("أدخل مبلغًا صحيحًا")
      return
    }
    const now = Date.now()
    const payload: Transaction = {
      type,
      amount: amt,
      date,
      reason: reason.trim(),
      projectId: projectId === "none" ? null : Number(projectId),
      contractorId: contractorId === "none" ? null : Number(contractorId),
      notes: notes.trim(),
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    }
    if (editing?.id) {
      await db.transactions.update(editing.id, payload)
      void recordActivity("transaction", `تعديل عملية (${date})`)
      toast.success("تم تعديل العملية")
    } else {
      await db.transactions.add(payload)
      void recordActivity("transaction", `إضافة عملية (${date})`)
      toast.success("تمت إضافة العملية")
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "تعديل العملية" : "عملية مالية جديدة"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["received", "withdrawn"] as TransactionType[]).map((tt) => (
              <button
                key={tt}
                type="button"
                onClick={() => setType(tt)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-medium transition-colors",
                  type === tt
                    ? tt === "received"
                      ? "border-success bg-success/10 text-success"
                      : "border-warning bg-warning/10 text-warning"
                    : "text-muted-foreground",
                )}
              >
                {TRANSACTION_TYPE_LABELS[tt]}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-amount">المبلغ</Label>
            <Input
              id="tx-amount"
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-date">التاريخ</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              اليوم:{" "}
              <span className="font-medium text-foreground">
                {weekdayName(date)}
              </span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-reason">السبب</Label>
            <Input
              id="tx-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: دفعة مقدمة"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>المشروع</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "none")}>
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
              <Select value={contractorId} onValueChange={(v) => setContractorId(v ?? "none")}>
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
            <Label htmlFor="tx-notes">ملاحظات</Label>
            <Textarea
              id="tx-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="اختياري"
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
