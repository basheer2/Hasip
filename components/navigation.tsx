import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  FileText,
  Settings,
  Users,
  Briefcase,
  ScrollText,
  BarChart3,
  Gauge,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react"

export type ViewKey =
  | "dashboard"
  | "workdays"
  | "transactions"
  | "records"
  | "reports"
  | "analytics"
  | "admin"
  | "projects"
  | "contractors"
  | "settings"
  | "more"

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
  { key: "analytics", label: "التحليلات", icon: BarChart3 },
  { key: "admin", label: "لوحة التحكم", icon: Gauge },
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
  "more",
]

export const MORE_ITEMS: NavEntry[] = [
  { key: "reports", label: "التقارير", icon: FileText },
  { key: "analytics", label: "التحليلات", icon: BarChart3 },
  { key: "admin", label: "لوحة التحكم", icon: Gauge },
  { key: "projects", label: "المشاريع", icon: Briefcase },
  { key: "contractors", label: "المقاولون", icon: Users },
  { key: "settings", label: "الإعدادات", icon: Settings },
]

export const MORE_ICON = LayoutGrid
