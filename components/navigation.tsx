import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  FileText,
  Settings,
  Users,
  Briefcase,
  ScrollText,
  type LucideIcon,
} from "lucide-react"

export type ViewKey =
  | "dashboard"
  | "workdays"
  | "transactions"
  | "records"
  | "reports"
  | "projects"
  | "contractors"
  | "settings"

export interface NavEntry {
  key: ViewKey
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavEntry[] = [
  { key: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { key: "workdays", label: "أيام العمل", icon: CalendarDays },
  { key: "transactions", label: "السحوبات", icon: Wallet },
  { key: "records", label: "السجل", icon: ScrollText },
  { key: "reports", label: "التقارير", icon: FileText },
  { key: "projects", label: "المشاريع", icon: Briefcase },
  { key: "contractors", label: "المقاولون", icon: Users },
  { key: "settings", label: "الإعدادات", icon: Settings },
]

// العناصر الأساسية في الشريط السفلي للجوال
export const BOTTOM_NAV_KEYS: ViewKey[] = [
  "dashboard",
  "workdays",
  "transactions",
  "records",
  "reports",
]
