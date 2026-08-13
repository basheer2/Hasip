"use client"

import { useMemo, useState } from "react"
import { Search, ScrollText, CalendarDays, TrendingUp, TrendingDown, Zap } from "lucide-react"
import {
  useWorkdays,
  useTransactions,
  useProjects,
  useContractors,
  useSettings,
} from "@/lib/use-data"
import { workDayValue, hasOvertime } from "@/lib/calc"
import { formatDate, formatNumber, weekdayName } from "@/lib/format"
import { WORK_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type FilterKind = "all" | "full" | "half" | "overtime" | "received" | "withdrawn"

interface Row {
  id: string
  date: string
  title: string
  subtitle: string
  amount: number
  kind: "work" | "received" | "withdrawn"
  projectId?: number | null
  contractorId?: number | null
  isFull: boolean
  isHalf: boolean
  hasOt: boolean
}

const KIND_FILTERS: { key: FilterKind; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "full", label: "يوم كامل" },
  { key: "half", label: "نصف يوم" },
  { key: "overtime", label: "إضافي" },
  { key: "received", label: "مستلم" },
  { key: "withdrawn", label: "مسحوب" },
]

export function RecordsView() {
  const workdays = useWorkdays()
  const transactions = useTransactions()
  const projects = useProjects()
  const contractors = useContractors()
  const settings = useSettings()
  const currency = settings?.currency ?? "ريال"

  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<FilterKind>("all")
  const [projectId, setProjectId] = useState("all")
  const [contractorId, setContractorId] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = []
    for (const w of workdays) {
      const p = projects.find((x) => x.id === w.projectId)
      const c = contractors.find((x) => x.id === w.contractorId)
      out.push({
        id: `w${w.id}`,
        date: w.date,
        title: WORK_TYPE_LABELS[w.type],
        subtitle: [p?.name, c?.name].filter(Boolean).join(" · ") || "بدون مشروع",
        amount: workDayValue(w),
        kind: "work",
        projectId: w.projectId,
        contractorId: w.contractorId,
        isFull: w.type === "full" || w.type === "full_overtime",
        isHalf: w.type === "half" || w.type === "half_overtime",
        hasOt: hasOvertime(w.type),
      })
    }
    for (const t of transactions) {
      const p = projects.find((x) => x.id === t.projectId)
      const c = contractors.find((x) => x.id === t.contractorId)
      out.push({
        id: `t${t.id}`,
        date: t.date,
        title: t.reason || TRANSACTION_TYPE_LABELS[t.type],
        subtitle:
          [p?.name, c?.name].filter(Boolean).join(" · ") ||
          TRANSACTION_TYPE_LABELS[t.type],
        amount: t.amount,
        kind: t.type,
        projectId: t.projectId,
        contractorId: t.contractorId,
        isFull: false,
        isHalf: false,
        hasOt: false,
      })
    }
    return out.sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [workdays, transactions, projects, contractors])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (query && !`${r.title} ${r.subtitle}`.includes(query)) return false
      if (from && r.date < from) return false
      if (to && r.date > to) return false
      if (projectId !== "all" && String(r.projectId) !== projectId) return false
      if (contractorId !== "all" && String(r.contractorId) !== contractorId)
        return false
      if (kind === "full" && !r.isFull) return false
      if (kind === "half" && !r.isHalf) return false
      if (kind === "overtime" && !r.hasOt) return false
      if (kind === "received" && r.kind !== "received") return false
      if (kind === "withdrawn" && r.kind !== "withdrawn") return false
      return true
    })
  }, [rows, query, from, to, projectId, contractorId, kind])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث في السجل..."
          className="pr-10"
        />
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setKind(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              kind === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="المشروع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المشاريع</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={contractorId} onValueChange={setContractorId}>
          <SelectTrigger>
            <SelectValue placeholder="المقاول" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المقاولين</SelectItem>
            {contractors.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">من</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">إلى</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        {formatNumber(filtered.length)} عملية
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="لا توجد نتائج"
          description="غيّر معايير البحث أو التصفية."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  r.kind === "work"
                    ? "bg-primary/10 text-primary"
                    : r.kind === "received"
                      ? "bg-success/15 text-success"
                      : "bg-warning/20 text-warning",
                )}
              >
                {r.kind === "work" ? (
                  r.hasOt ? (
                    <Zap className="size-5" />
                  ) : (
                    <CalendarDays className="size-5" />
                  )
                ) : r.kind === "received" ? (
                  <TrendingUp className="size-5" />
                ) : (
                  <TrendingDown className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {r.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(r.date)} · {weekdayName(r.date)} · {r.subtitle}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-bold",
                  r.kind === "work"
                    ? "text-foreground"
                    : r.kind === "received"
                      ? "text-success"
                      : "text-warning",
                )}
              >
                {r.kind === "work" ? "+" : "-"}
                {formatNumber(r.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
