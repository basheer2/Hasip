import { db, ensureSettings } from "./db"
import { DEFAULT_SETTINGS } from "./types"
import { todayISO } from "./format"
import { saveFile } from "./native"

interface BackupPayload {
  version: number
  exportedAt: string
  workdays: unknown[]
  transactions: unknown[]
  projects: unknown[]
  contractors: unknown[]
  settings: unknown[]
}

export async function exportBackup(): Promise<void> {
  const [workdays, transactions, projects, contractors, settings] = await Promise.all([
    db.workdays.toArray(),
    db.transactions.toArray(),
    db.projects.toArray(),
    db.contractors.toArray(),
    db.settings.toArray(),
  ])

  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workdays,
    transactions,
    projects,
    contractors,
    settings,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  await saveFile(`backup-${todayISO()}.json`, blob)
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as Partial<BackupPayload>

  if (!data || typeof data !== "object" || !("workdays" in data)) {
    throw new Error("ملف غير صالح")
  }

  await db.transaction("rw", [db.workdays, db.transactions, db.projects, db.contractors, db.settings], async () => {
    await Promise.all([
      db.workdays.clear(),
      db.transactions.clear(),
      db.projects.clear(),
      db.contractors.clear(),
      db.settings.clear(),
    ])
    if (Array.isArray(data.workdays)) await db.workdays.bulkPut(data.workdays as never[])
    if (Array.isArray(data.transactions)) await db.transactions.bulkPut(data.transactions as never[])
    if (Array.isArray(data.projects)) await db.projects.bulkPut(data.projects as never[])
    if (Array.isArray(data.contractors)) await db.contractors.bulkPut(data.contractors as never[])
    if (Array.isArray(data.settings) && data.settings.length > 0) {
      await db.settings.bulkPut(data.settings as never[])
    }
  })
  await ensureSettings()
}

export async function resetAllData(): Promise<void> {
  await db.transaction("rw", [db.workdays, db.transactions, db.projects, db.contractors, db.settings], async () => {
    await Promise.all([
      db.workdays.clear(),
      db.transactions.clear(),
      db.projects.clear(),
      db.contractors.clear(),
      db.settings.clear(),
    ])
    await db.settings.put(DEFAULT_SETTINGS)
  })
}
