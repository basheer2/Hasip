"use client"

import { useRef, useState } from "react"
import { useSettings } from "@/lib/use-data"
import { db, hashPassword } from "@/lib/db"
import { exportBackup, importBackup, resetAllData } from "@/lib/backup"
import type { Settings } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User, Coins, Lock, Database, Trash2, Download, Upload, Save } from "lucide-react"
import { toast } from "sonner"
import { recordActivity } from "@/lib/activity"
import { PasswordDialog } from "@/components/password-dialog"

export function SettingsView() {
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)

  // General form state
  const [form, setForm] = useState<Settings | null>(null)
  const current = form ?? settings
  const dirty = form !== null

  const [pwOpen, setPwOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  function patch(p: Partial<Settings>) {
    setForm({ ...current, ...p })
  }

  async function saveGeneral() {
    await db.settings.put({ ...current, id: 1 })
    setForm(null)
    toast.success("تم حفظ الإعدادات")
  }

  async function toggleLogin(enabled: boolean) {
    if (enabled && !current.passwordHash) {
      // enabling requires a password first
      setPwOpen(true)
      return
    }
    await db.settings.put({ ...current, id: 1, loginEnabled: enabled })
    if (form) setForm({ ...current, loginEnabled: enabled })
    void recordActivity("security", enabled ? "تفعيل تسجيل الدخول" : "إيقاف تسجيل الدخول")
    toast.success(enabled ? "تم تفعيل تسجيل الدخول" : "تم إيقاف تسجيل الدخول")
  }

  async function handleExport() {
    try {
      await exportBackup()
      await db.settings.put({ ...current, id: 1, lastBackupAt: Date.now() })
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

  async function handleReset() {
    await resetAllData()
    setResetOpen(false)
    setForm(null)
    void recordActivity("reset", "تصفير جميع البيانات")
    toast.success("تم تصفير جميع البيانات")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-sm text-muted-foreground">تحكّم كامل في النظام والحماية والنسخ الاحتياطي</p>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-5 text-primary" />
            المعلومات العامة
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="userName">اسم المستخدم</Label>
              <Input
                id="userName"
                value={current.userName}
                onChange={(e) => patch({ userName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="systemName">اسم النظام</Label>
              <Input
                id="systemName"
                value={current.systemName}
                onChange={(e) => patch({ systemName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultContractor">المقاول الافتراضي</Label>
              <Input
                id="defaultContractor"
                value={current.defaultContractor}
                onChange={(e) => patch({ defaultContractor: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">العملة</Label>
              <Input
                id="currency"
                value={current.currency}
                onChange={(e) => patch({ currency: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="size-5 text-primary" />
            القيم المالية الافتراضية
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dailyRate">اليومية الافتراضية</Label>
            <Input
              id="dailyRate"
              type="number"
              inputMode="numeric"
              value={current.defaultDailyRate}
              onChange={(e) => patch({ defaultDailyRate: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="overtimeRate">قيمة الإضافي الافتراضية</Label>
            <Input
              id="overtimeRate"
              type="number"
              inputMode="numeric"
              value={current.defaultOvertimeRate}
              onChange={(e) => patch({ defaultOvertimeRate: Number(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      {dirty && (
        <div className="sticky bottom-24 z-10 flex justify-end md:bottom-4">
          <Button onClick={saveGeneral} className="gap-2 shadow-lg">
            <Save className="size-4" />
            حفظ التعديلات
          </Button>
        </div>
      )}

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="size-5 text-primary" />
            الحماية وتسجيل الدخول
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">تفعيل تسجيل الدخول</p>
              <p className="text-xs text-muted-foreground">حماية التطبيق بكلمة مرور عند الفتح</p>
            </div>
            <Switch
              checked={settings.loginEnabled}
              onCheckedChange={toggleLogin}
              aria-label="تفعيل تسجيل الدخول"
            />
          </div>
          <Separator />
          <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setPwOpen(true)}>
            <Lock className="size-4" />
            {settings.passwordHash ? "تغيير كلمة المرور" : "تعيين كلمة المرور"}
          </Button>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="size-5 text-primary" />
            النسخ الاحتياطي
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
              <Download className="size-4" />
              تصدير البيانات
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              استيراد البيانات
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
          <p className="text-xs text-muted-foreground">
            تشمل النسخة أيام العمل والسحوبات والمقاولين والمشاريع والإعدادات.
          </p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-negative/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-negative">
            <Trash2 className="size-5" />
            منطقة الخطر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="gap-2" onClick={() => setResetOpen(true)}>
            <Trash2 className="size-4" />
            تصفير جميع البيانات
          </Button>
        </CardContent>
      </Card>

      <PasswordDialog
        open={pwOpen}
        hasPassword={!!settings.passwordHash}
        onOpenChange={setPwOpen}
        onSaved={async (hash) => {
          await db.settings.put({ ...current, id: 1, passwordHash: hash, loginEnabled: true })
          setForm(null)
          setPwOpen(false)
          void recordActivity("security", "تغيير كلمة المرور")
          toast.success("تم حفظ كلمة المرور")
        }}
        currentHash={settings.passwordHash}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد التصفير</DialogTitle>
            <DialogDescription>
              سيتم حذف جميع البيانات نهائيًا (أيام العمل، السحوبات، المشاريع، المقاولون). لا يمكن التراجع.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              نعم، احذف الكل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
