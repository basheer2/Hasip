"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { hashPassword } from "@/lib/db"

export function PasswordDialog({
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
