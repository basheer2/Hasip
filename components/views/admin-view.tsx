"use client"

import { useMemo, useRef, useState } from "react"
import {
  Database,
  HardDrive,
  ShieldCheck,
  History,
  Target,
  Timer,
  BellRing,
  Trash2,
  Download,
  Upload,
  KeyRound,
  LockOpen,
  Save,
  CalendarDays,
  Wallet,
  Briefcase,
  Users,
  Activity as ActivityIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useSettings } from "@/lib/use-data"
import { db } from "@/lib/db"
import { exportBackup, importBackup, resetAllData } from "@/lib/backup"
import {
  useActivity,
  useDbStats,
  useStorageEstimate,
  recordActivity,
  clearActivityLog,
} from "@/lib/activity"
import { ACTIVITY_TYPE_LABELS, type Settings, type ActivityType } from "@/lib/types"
import { formatNumber } from "@/lib/format"
import { PasswordDialog } from "@/components/password-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function formatBytes(bytes: number): string {
  if (!bytes) return "0 بايت"
  const units = ["بايت", "كيلوبايت", "ميغابايت", "غيغابايت"]
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${formatNumber(Math.round(v * 100) / 100)} ${units[i]}`
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("ar-EG", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

const ACTIVITY_ICONS: Record<ActivityType, typeof History> = {
  login: KeyRound,
  workday: CalendarDays,
  transaction: Wallet,
  project: Briefcase,
  contractor: Users,
  backup: Download,
  reset: Trash2,
  settings: Save,
  security: ShieldCheck,
  export: Upload,
}

interface WipeTarget {
  key: string
  label: string
  icon: typeof Database
  run: () => Promise<void>
}

export function AdminView() {
  const settings = useSettings()
  const stats = useDbStats()
  const storage = useStorageEstimate()
  const activity = useActivity()

  const fileRef = useRef<HTMLInputElement>(null)

  // إعدادات متقدمة
  const [form, setForm] = useState<Partial<Settings> | null>(null)
  const current = { ...settings, ...form }

  const [pwOpen, setPwOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<WipeTarget | null>(null)

  const dataCards = useMemo(
    () => [
      { label: "أيام العمل", value: stats.workdays, icon: CalendarDays, tone: "text-primary bg-primary/10" },
      { label: "العمليات المالية", value: stats.transactions, icon: Wallet, tone: "text-success bg-success/15" },
      { label: "المشاريع", value: stats.projects, icon: Briefcase, tone: "text-info bg-info/15" },
      { label: "المقاولون", value: stats.contractors, icon: Users, tone: "text-warning bg-warning/20" },
      { label: "سجل النشاط", value: stats.activity, icon: ActivityIcon, tone: "text-muted-foreground bg-muted" },
    ],
    [stats],
  )

  const wipeTargets: WipeTarget[] = useMemo(
    () => [
      {
        key: "workdays",
        label: "جميع أيام العمل",
        icon: CalendarDays,
        run: async () => {
          await db.workdays.clear()
          void recordActivity("reset", "حذف جميع أيام العمل")
        },
      },
      {
        key: "transactions",
        label: "جميع العمليات المالية",
        icon: Wallet,
        run: async () => {
          await db.transactions.clear()
          void recordActivity("reset", "حذف جميع العمليات المالية")
        },
      },
      {
        key: "projects",
        label: "جميع المشاريع",
        icon: Briefcase,
        run: async () => {
          await db.projects.clear()
          void recordActivity("reset", "حذف جميع المشاريع")
        },
      },
      {
        key: "contractors",
        label: "جميع المقاولين",
        icon: Users,
        run: async () => {
          await db.contractors.clear()
          void recordActivity("reset", "حذف جميع المقاولين")
        },
      },
    ],
    [],
  )

  function patch(p: Partial<Settings>) {
    setForm({ ...current, ...p })
  }

  async function saveAdvanced() {
    await db.settings.put({ ...current, id: 1 })
    setForm(null)
    void recordActivity("settings", "تحديث إعدادات لوحة التحكم (الهدف، القفل، التذكير)")
    toast.success("تم حفظ الإعدادات المتقدمة")
  }

  async function handleExport() {
    try {
      await exportBackup()
      await db.settings.put({ ...settings, id: 1, lastBackupAt: Date.now() })
      void recordActivity("backup", "تصدير نسخة احتياطية من البيانات")
      toast.success("تم تصدير النسخة الاحتياطية")
    } catch {
      toast.error("تعذّر التصدير")
    }
  }

  async function handleImportFile(file: File) {
    try {
      await importBackup(file)
      void recordActivity("backup", "استيراد نسخة احتياطية واستعادة البيانات")
      toast.success("تم استيراد البيانات")
    } catch {
      toast.error("ملف النسخة غير صالح")
    }
  }

  async function handleWipe() {
    if (!confirmTarget) return
    await confirmTarget.run()
    setConfirmOpen(false)
    setConfirmTarget(null)
    toast.success("تم الحذف")
  }

  async function handleResetAll() {
    await resetAllData()
    setConfirmOpen(false)
    setConfirmTarget(null)
    setForm(null)
    void recordActivity("reset", "تصفير جميع البيانات")
    toast.success("تم تصفير جميع البيانات")
  }

  async function handleClearLog() {
    await clearActivityLog()
    void recordActivity("settings", "مسح سجل النشاط")
    toast.success("تم مسح سجل النشاط")
  }

  async function toggleActivityLog(enabled: boolean) {
    await db.settings.put({ ...settings, id: 1, enableActivityLog: enabled })
    if (form) setForm({ ...current, enableActivityLog: enabled })
    void recordActivity("settings", enabled ? "تفعيل سجل النشاط" : "إيقاف سجل النشاط")
    toast.success(enabled ? "تم تفعيل سجل النشاط" : "تم إيقاف سجل النشاط")
  }

  async function disablePassword() {
    await db.settings.put({ ...settings, id: 1, passwordHash: null, loginEnabled: false })
    void recordActivity("security", "إزالة كلمة المرور وتعطيل تسجيل الدخول")
    toast.success("تمت إزالة كلمة المرور")
  }

  const lastBackupText = settings.lastBackupAt
    ? formatTime(settings.lastBackupAt)
    : "لا توجد نسخة بعد"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground">
          تحكّم كامل في التطبيق والبيانات والأمان وسجل النشاط
        </p>
      </div>

      {/* ——— نظرة عامة على البيانات ——— */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="size-5 text-primary" />
            نظرة عامة على البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {dataCards.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.label} className="rounded-2xl border bg-card p-3 shadow-sm">
                  <span className={cn("mb-2 flex size-9 items-center justify-center rounded-xl", c.tone)}>
                    <Icon className="size-4.5" />
                  </span>
                  <p className="text-xl font-extrabold text-card-foreground">
                    {formatNumber(c.value)}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              )
            })}
            <div className="rounded-2xl border bg-card p-3 shadow-sm">
              <span className="mb-2 flex size-9 items-center justify-center rounded-xl bg-info/15 text-info">
                <HardDrive className="size-4.5" />
              </span>
              <p className="text-sm font-extrabold leading-6 text-card-foreground">
                {storage ? formatBytes(storage.usage) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">حجم البيانات</p>
            </div>
            <div className="rounded-2xl border bg-card p-3 shadow-sm">
              <span className="mb-2 flex size-9 items-center justify-center rounded-xl bg-success/15 text-success">
                <Download className="size-4.5" />
              </span>
              <p className="truncate text-sm font-extrabold leading-6 text-card-foreground">
                {lastBackupText}
              </p>
              <p className="text-xs text-muted-foreground">آخر نسخة احتياطية</p>
            </div>
            <div className="rounded-2xl border bg-card p-3 shadow-sm">
              <span className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-4.5" />
              </span>
              <p className="text-sm font-extrabold leading-6 text-card-foreground">
                {settings.loginEnabled ? "محمي" : "بدون حماية"}
              </p>
              <p className="text-xs text-muted-foreground">حالة الحماية</p>
            </div>
          </div>
          {storage && storage.quota > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (storage.usage / storage.quota) * 100)}%` }}
                />
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatNumber(Math.round((storage.usage / storage.quota) * 100))}% من المساحة المتاحة
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ——— الإعدادات المتقدمة ——— */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="size-5 text-primary" />
            الإعدادات المتقدمة
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="monthlyGoal">الهدف الشهري (0 = إيقاف)</Label>
            <Input
              id="monthlyGoal"
              type="number"
              inputMode="numeric"
              value={current.monthlyGoal ?? 0}
              onChange={(e) => patch({ monthlyGoal: Number(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              يظهر شريط تقدم الهدف في الرئيسية والتحليلات.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>القفل التلقائي</Label>
            <Select
              value={String(current.autoLockMinutes ?? 0)}
              onValueChange={(v) => patch({ autoLockMinutes: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">معطّل</SelectItem>
                <SelectItem value="1">بعد دقيقة واحدة</SelectItem>
                <SelectItem value="5">بعد 5 دقائق</SelectItem>
                <SelectItem value="15">بعد 15 دقيقة</SelectItem>
                <SelectItem value="30">بعد 30 دقيقة</SelectItem>
                <SelectItem value="60">بعد ساعة</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              يقفل التطبيق تلقائيًا عند الخمول (يتطلب تفعيل كلمة المرور).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>تذكير النسخ الاحتياطي</Label>
            <Select
              value={String(current.backupReminderDays ?? 0)}
              onValueChange={(v) => patch({ backupReminderDays: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">معطّل</SelectItem>
                <SelectItem value="7">كل أسبوع</SelectItem>
                <SelectItem value="14">كل أسبوعين</SelectItem>
                <SelectItem value="30">كل شهر</SelectItem>
                <SelectItem value="60">كل شهرين</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(form && Object.keys(form).length > 0) && (
            <Button className="gap-2 self-end" onClick={saveAdvanced}>
              <Save className="size-4" />
              حفظ الإعدادات
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ——— الأمان ——— */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="size-5 text-primary" />
            الأمان
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">كلمة المرور</p>
              <p className="text-xs text-muted-foreground">
                {settings.passwordHash ? "مفعلة — التطبيق محمي" : "غير معينة"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setPwOpen(true)}>
                <KeyRound className="size-4" />
                {settings.passwordHash ? "تغيير" : "تعيين"}
              </Button>
              {settings.passwordHash && (
                <Button variant="destructive" className="gap-2" onClick={disablePassword}>
                  <LockOpen className="size-4" />
                  إزالة
                </Button>
              )}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">تسجيل الدخول</p>
              <p className="text-xs text-muted-foreground">
                طلب كلمة المرور عند فتح التطبيق
              </p>
            </div>
            <Switch
              checked={settings.loginEnabled}
              onCheckedChange={async (enabled) => {
                if (enabled && !settings.passwordHash) {
                  setPwOpen(true)
                  return
                }
                await db.settings.put({ ...settings, id: 1, loginEnabled: enabled })
                void recordActivity("security", enabled ? "تفعيل تسجيل الدخول" : "إيقاف تسجيل الدخول")
                toast.success(enabled ? "تم تفعيل تسجيل الدخول" : "تم إيقاف تسجيل الدخول")
              }}
              aria-label="تفعيل تسجيل الدخول"
            />
          </div>
        </CardContent>
      </Card>

      {/* ——— إدارة البيانات ——— */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="size-5 text-primary" />
            إدارة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
              <Download className="size-4" />
              تصدير نسخة احتياطية
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" />
              استيراد نسخة احتياطية
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImportFile(f)
              e.target.value = ""
            }}
          />

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">حذف بيانات فئة محددة</p>
            <div className="grid grid-cols-2 gap-2">
              {wipeTargets.map((t) => {
                const Icon = t.icon
                return (
                  <Button
                    key={t.key}
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent text-negative hover:text-negative"
                    onClick={() => {
                      setConfirmTarget(t)
                      setConfirmOpen(true)
                    }}
                  >
                    <Icon className="size-4" />
                    {t.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-negative/30 bg-negative/5 p-3">
            <p className="text-sm font-bold text-negative">منطقة الخطر</p>
            <p className="mb-3 text-xs text-muted-foreground">
              حذف جميع البيانات نهائيًا (أيام العمل، العمليات، المشاريع، المقاولون، السجل). لا يمكن التراجع.
            </p>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                setConfirmTarget({
                  key: "all",
                  label: "جميع البيانات",
                  icon: Database,
                  run: async () => {},
                })
                setConfirmOpen(true)
              }}
            >
              <Trash2 className="size-4" />
              تصفير جميع البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— سجل النشاط ——— */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="size-5 text-primary" />
            سجل النشاط
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">تسجيل النشاط</p>
              <p className="text-xs text-muted-foreground">
                توثيق جميع العمليات داخل التطبيق (آخر {500} حدث)
              </p>
            </div>
            <Switch
              checked={settings.enableActivityLog}
              onCheckedChange={toggleActivityLog}
              aria-label="تفعيل سجل النشاط"
            />
          </div>
          {activity.length > 0 ? (
            <>
              <div className="max-h-72 space-y-1.5 overflow-y-auto pl-1">
                {activity.slice(0, 100).map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type] ?? History
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-card-foreground">{a.message}</p>
                        <p className="text-[11px] text-muted-foreground">{formatTime(a.timestamp)}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {ACTIVITY_TYPE_LABELS[a.type]}
                      </Badge>
                    </div>
                  )
                })}
              </div>
              <Button variant="outline" size="sm" className="gap-2 self-end bg-transparent text-negative" onClick={handleClearLog}>
                <Trash2 className="size-4" />
                مسح السجل
              </Button>
            </>
          ) : (
            <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
              لا توجد أحداث مسجلة بعد.
            </p>
          )}
        </CardContent>
      </Card>

      <PasswordDialog
        open={pwOpen}
        hasPassword={!!settings.passwordHash}
        onOpenChange={setPwOpen}
        onSaved={async (hash) => {
          await db.settings.put({ ...settings, id: 1, passwordHash: hash, loginEnabled: true })
          setPwOpen(false)
          void recordActivity("security", "تعيين / تغيير كلمة المرور")
          toast.success("تم حفظ كلمة المرور")
        }}
        currentHash={settings.passwordHash}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              {confirmTarget?.key === "all"
                ? "سيتم حذف جميع البيانات نهائيًا (أيام العمل، العمليات، المشاريع، المقاولون، سجل النشاط). لا يمكن التراجع."
                : `سيتم حذف ${confirmTarget?.label} نهائيًا من هذا الجهاز. لا يمكن التراجع.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmTarget?.key === "all" ? handleResetAll : handleWipe}
            >
              نعم، احذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
