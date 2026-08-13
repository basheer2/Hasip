import type { LucideIcon } from "lucide-react"

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-semibold text-card-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}
