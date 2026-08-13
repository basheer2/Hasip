export type WorkType =
  | "full"
  | "half"
  | "overtime"
  | "full_overtime"
  | "half_overtime"

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  full: "يوم كامل",
  half: "نصف يوم",
  overtime: "عمل إضافي",
  full_overtime: "يوم كامل + إضافي",
  half_overtime: "نصف يوم + إضافي",
}

export type TransactionType = "received" | "withdrawn"

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  received: "مبلغ مستلم",
  withdrawn: "مبلغ مسحوب",
}

export interface WorkDay {
  id?: number
  date: string // ISO yyyy-mm-dd
  type: WorkType
  dailyRate: number
  overtimeAmount: number
  projectId?: number | null
  contractorId?: number | null
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Transaction {
  id?: number
  type: TransactionType
  amount: number
  date: string // ISO yyyy-mm-dd
  reason?: string
  projectId?: number | null
  contractorId?: number | null
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Project {
  id?: number
  name: string
  location?: string
  contractorId?: number | null
  dailyRate: number
  overtimeRate: number
  startDate?: string
  endDate?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Contractor {
  id?: number
  name: string
  phone?: string
  company?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Settings {
  id?: number
  userName: string
  systemName: string
  defaultContractor: string
  currency: string
  defaultDailyRate: number
  defaultOvertimeRate: number
  loginEnabled: boolean
  passwordHash: string | null
  theme: "light" | "dark" | "system"
  // ——— ميزات احترافية ———
  monthlyGoal: number // الهدف الشهري (0 = غير مفعّل)
  autoLockMinutes: number // القفل التلقائي بالدقائق (0 = غير مفعّل)
  backupReminderDays: number // تذكير النسخ الاحتياطي (0 = غير مفعّل)
  lastBackupAt: number | null // آخر نسخة احتياطية (timestamp)
  enableActivityLog: boolean // تفعيل سجل النشاط
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  userName: "فني الكهرباء",
  systemName: "الحساب اليومي",
  defaultContractor: "",
  currency: "ريال",
  defaultDailyRate: 10000,
  defaultOvertimeRate: 5000,
  loginEnabled: false,
  passwordHash: null,
  theme: "system",
  monthlyGoal: 0,
  autoLockMinutes: 0,
  backupReminderDays: 0,
  lastBackupAt: null,
  enableActivityLog: true,
}

// ——— سجل النشاط ———
export type ActivityType =
  | "login"
  | "workday"
  | "transaction"
  | "project"
  | "contractor"
  | "backup"
  | "reset"
  | "settings"
  | "security"
  | "export"

export interface ActivityEntry {
  id?: number
  timestamp: number
  type: ActivityType
  message: string
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  login: "دخول",
  workday: "أيام العمل",
  transaction: "العمليات",
  project: "المشاريع",
  contractor: "المقاولون",
  backup: "نسخ احتياطي",
  reset: "حذف",
  settings: "إعدادات",
  security: "حماية",
  export: "تصدير",
}
