import Dexie, { type Table } from "dexie"
import type {
  WorkDay,
  Transaction,
  Project,
  Contractor,
  Settings,
  ActivityEntry,
} from "./types"
import { DEFAULT_SETTINGS } from "./types"

export class AccountingDB extends Dexie {
  workdays!: Table<WorkDay, number>
  transactions!: Table<Transaction, number>
  projects!: Table<Project, number>
  contractors!: Table<Contractor, number>
  settings!: Table<Settings, number>
  activity!: Table<ActivityEntry, number>

  constructor() {
    super("electrician-accounting")
    this.version(1).stores({
      workdays: "++id, date, type, projectId, contractorId, createdAt",
      transactions: "++id, date, type, projectId, contractorId, createdAt",
      projects: "++id, name, contractorId, createdAt",
      contractors: "++id, name, createdAt",
      settings: "id",
    })
    this.version(2).stores({
      workdays: "++id, date, type, projectId, contractorId, createdAt",
      transactions: "++id, date, type, projectId, contractorId, createdAt",
      projects: "++id, name, contractorId, createdAt",
      contractors: "++id, name, createdAt",
      settings: "id",
      activity: "++id, timestamp, type",
    })
  }
}

export const db = new AccountingDB()

let seeded = false

export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get(1)
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }
  // دمج الإعدادات القديمة مع الحقول الجديدة (ترقية آمنة بدون فقدان بيانات)
  const merged: Settings = { ...DEFAULT_SETTINGS, ...existing, id: 1 }
  await db.settings.put(merged)
  return merged
}

export async function seedIfEmpty() {
  if (seeded) return
  seeded = true
  await ensureSettings()
}

// --- Password hashing (SHA-256 via WebCrypto) ---
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
