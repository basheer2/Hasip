"use client"

import { MORE_ITEMS, type ViewKey } from "@/components/navigation"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

export function MoreView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-gradient-to-bl from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
        <p className="text-sm opacity-85">جميع أقسام التطبيق</p>
        <p className="mt-1 text-lg font-bold">اختر القسم الذي تريد الانتقال إليه</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MORE_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-2xl border bg-card p-4 text-right shadow-sm transition-transform active:scale-[0.98]",
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-card-foreground">
                  {item.label}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="size-3" />
                  افتح القسم
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
