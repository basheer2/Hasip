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
    toast.success(enabled ? "تم تفعيل تسجيل الدخول" : "تم إيقاف تسجيل الدخول")
  }

  async function handleExport() {
    try {
      await exportBackup()
      toast.success("تم تصدير النسخة الاحتياطية")
    } catch {
      toast.error("تعذّر التصدير")
    }
  }

  async function handleImportFile(file: File) {
    try {
      await importBackup(file)
      toast.success("تم استيراد البيانات")
    } catch {
      toast.error("ملف النسخة غير صالح")
    }
  }

  async function handleReset() {
    await resetAllData()
    setResetOpen(false)
    setForm(null)
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

function PasswordDialog({
  open,
  onOpenChange,
  onSaved,
  hasPassword,
  currentHash,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: (hash: string) => void
  hasPassword: boolean
  currentHash: string | null
}) {
  const [oldPw, setOldPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  async function submit() {
    setError("")
    if (hasPassword && currentHash) {
      const oldHash = await hashPassword(oldPw)
      if (oldHash !== currentHash) {
        setError("كلمة المرور الحالية غير صحيحة")
        return
      }
    }
    if (newPw.length < 4) {
      setError("كلمة المرور يجب أن تكون 4 أحرف على الأقل")
      return
    }
    if (newPw !== confirm) {
      setError("كلمتا المرور غير متطابقتين")
      return
    }
    const hash = await hashPassword(newPw)
    setOldPw("")
    setNewPw("")
    setConfirm("")
    onSaved(hash)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasPassword ? "تغيير كلمة المرور" : "تعيين كلمة المرور"}</DialogTitle>
          <DialogDescription>تُخزَّن كلمة المرور مشفّرة داخل الجهاز فقط.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {hasPassword && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="oldPw">كلمة المرور الحالية</Label>
              <Input id="oldPw" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPw">كلمة المرور الجديدة</Label>
            <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPw">تأكيد كلمة المرور</Label>
            <Input id="confirmPw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p className="text-sm font-medium text-negative">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={submit}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
