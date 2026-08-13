"use client"

import { useEffect, useRef, useState } from "react"
import { Zap, Moon, Sun, Monitor } from "lucide-react"
import { seedIfEmpty, db } from "@/lib/db"
import { useSettings } from "@/lib/use-data"
import { recordActivity } from "@/lib/activity"
import { useTheme, type ThemeMode } from "@/lib/use-theme"
import { LoginGate } from "@/components/login-gate"
import { NAV_ITEMS, BOTTOM_NAV_KEYS, MORE_ICON, type ViewKey } from "@/components/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { DashboardView } from "@/components/views/dashboard-view"
import { WorkdaysView } from "@/components/views/workdays-view"
import { TransactionsView } from "@/components/views/transactions-view"
import { RecordsView } from "@/components/views/records-view"
import { ReportsView } from "@/components/views/reports-view"
import { AnalyticsView } from "@/components/views/analytics-view"
import { AdminView } from "@/components/views/admin-view"
import { ProjectsView } from "@/components/views/projects-view"
import { ContractorsView } from "@/components/views/contractors-view"
import { SettingsView } from "@/components/views/settings-view"
import { MoreView } from "@/components/views/more-view"

const VIEW_TITLES: Record<ViewKey, string> = {
  dashboard: "لوحة التحكم",
  workdays: "أيام العمل",
  transactions: "السحوبات والمستلمات",
  records: "السجل الكامل",
  reports: "التقارير",
  analytics: "التحليلات",
  admin: "لوحة التحكم",
  projects: "المشاريع والمواقع",
  contractors: "المقاولون",
  settings: "الإعدادات",
  more: "المزيد",
}

export function MainApp() {
  const settings = useSettings()
  const { theme, setTheme } = useTheme()
  const [view, setView] = useState<ViewKey>("dashboard")
  const [ready, setReady] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const lastActivity = useRef(Date.now())
  const reminderShown = useRef(false)

  useEffect(() => {
    seedIfEmpty().then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem("app-unlocked") === "1") setUnlocked(true)
  }, [])

  // ——— القفل التلقائي بعد فترة خمول ———
  useEffect(() => {
    if (!settings.loginEnabled || !settings.passwordHash || settings.autoLockMinutes <= 0) return
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const
    const bump = () => {
      lastActivity.current = Date.now()
    }
    events.forEach((e) => window.addEventListener(e, bump))
    const iv = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current
      if (idle >= settings.autoLockMinutes * 60_000) {
        sessionStorage.removeItem("app-unlocked")
        setUnlocked(false)
      }
    }, 10_000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump))
      window.clearInterval(iv)
    }
  }, [settings.loginEnabled, settings.passwordHash, settings.autoLockMinutes])

  // ——— تذكير النسخ الاحتياطي ———
  useEffect(() => {
    if (!ready || reminderShown.current) return
    const days = settings.backupReminderDays
    if (days <= 0) return
    const last = settings.lastBackupAt
    const overdue = last == null || Date.now() - last > days * 86_400_000
    if (!overdue) return
    reminderShown.current = true
    const t = window.setTimeout(() => {
      import("sonner").then(({ toast }) => {
        toast.warning("حان وقت النسخ الاحتياطي", {
          description: `آخر نسخة احتياطية قبل أكثر من ${days} يوم. صدّر نسخة من لوحة التحكم.`,
          action: {
            label: "تصدير الآن",
            onClick: () => {
              setView("admin")
            },
          },
          duration: 10_000,
        })
      })
    }, 1500)
    return () => window.clearTimeout(t)
  }, [ready, settings.backupReminderDays, settings.lastBackupAt])

  if (!ready || !settings) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground animate-pulse">
          <Zap className="size-7" />
        </span>
      </div>
    )
  }

  const needsAuth = settings.loginEnabled && settings.passwordHash && !unlocked
  if (needsAuth) {
    return (
      <LoginGate
        settings={settings}
        onUnlock={() => {
          sessionStorage.setItem("app-unlocked", "1")
          void recordActivity("login", "دخول إلى النظام")
          setUnlocked(true)
        }}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l bg-sidebar md:flex">
        <div className="flex items-center gap-3 border-b px-5 py-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-sidebar-foreground">
              {settings.systemName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {settings.userName}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = view === item.key
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t p-3">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </aside>

      {/* Main column */}
      <div className="md:mr-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground md:hidden">
              <Zap className="size-5" />
            </span>
            <h1 className="text-lg font-bold text-foreground">
              {VIEW_TITLES[view]}
            </h1>
          </div>
          <div className="md:hidden">
            <ThemeToggle theme={theme} setTheme={setTheme} compact />
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:max-w-4xl md:pb-10">
          {view === "dashboard" && <DashboardView onNavigate={setView} />}
          {view === "workdays" && <WorkdaysView />}
          {view === "transactions" && <TransactionsView />}
          {view === "records" && <RecordsView />}
          {view === "reports" && <ReportsView />}
          {view === "analytics" && <AnalyticsView />}
          {view === "admin" && <AdminView />}
          {view === "projects" && <ProjectsView />}
          {view === "contractors" && <ContractorsView />}
          {view === "settings" && <SettingsView />}
          {view === "more" && <MoreView onNavigate={setView} />}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {BOTTOM_NAV_KEYS.map((key) => {
            const item =
              key === "more"
                ? { key, label: "المزيد", icon: MORE_ICON }
                : NAV_ITEMS.find((n) => n.key === key)!
            const Icon = item.icon
            const active = view === key
            return (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "scale-110")} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function ThemeToggle({
  theme,
  setTheme,
  compact,
}: {
  theme: ThemeMode
  setTheme: (m: ThemeMode) => void
  compact?: boolean
}) {
  const modes: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
    { key: "light", icon: Sun, label: "فاتح" },
    { key: "dark", icon: Moon, label: "داكن" },
    { key: "system", icon: Monitor, label: "تلقائي" },
  ]

  if (compact) {
    const order: ThemeMode[] = ["light", "dark", "system"]
    const next = order[(order.indexOf(theme) + 1) % order.length]
    const current = modes.find((m) => m.key === theme)!
    const Icon = current.icon
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(next)}
        aria-label="تبديل السمة"
      >
        <Icon className="size-4" />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
      {modes.map((m) => {
        const Icon = m.icon
        return (
          <button
            key={m.key}
            onClick={() => setTheme(m.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
              theme === m.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
