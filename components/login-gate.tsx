"use client"

import type React from "react"
import { useState } from "react"
import { Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { hashPassword } from "@/lib/db"
import type { Settings } from "@/lib/types"

interface LoginGateProps {
  settings: Settings
  onUnlock: () => void
}

export function LoginGate({ settings, onUnlock }: LoginGateProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const hash = await hashPassword(password)
      if (hash === settings.passwordHash) {
        sessionStorage.setItem("app-unlocked", "1")
        onUnlock()
      } else {
        setError("كلمة المرور غير صحيحة")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Zap className="size-8" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">
            {settings.systemName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أدخل كلمة المرور للدخول إلى النظام
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="h-12 pr-10 text-base"
              autoFocus
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}
          <Button
            type="submit"
            className="h-12 w-full text-base"
            disabled={loading || !password}
          >
            دخول
          </Button>
        </form>
      </div>
    </div>
  )
}
