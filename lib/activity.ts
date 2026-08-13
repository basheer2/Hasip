"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "./db"
import type { ActivityEntry, ActivityType } from "./types"

const MAX_ENTRIES = 500

// تسجيل حدث في سجل النشاط (مع حد أقصى 500 سجل)
export async function recordActivity(type: ActivityType, message: string): Promise<void> {
  try {
    const settings = await db.settings.get(1)
    if (settings && settings.enableActivityLog === false) return
    await db.activity.add({ timestamp: Date.now(), type, message })
    const count = await db.activity.count()
    if (count > MAX_ENTRIES) {
      const old = await db.activity
        .orderBy("timestamp")
        .limit(count - MAX_ENTRIES)
        .primaryKeys()
      if (old.length > 0) await db.activity.bulkDelete(old)
    }
  } catch {
    // سجل النشاط غير حرج — لا نوقف التطبيق عند أي خطأ
  }
}

export async function clearActivityLog(): Promise<void> {
  await db.activity.clear()
}

export function useActivity() {
  return useLiveQuery(
    () => db.activity.orderBy("timestamp").reverse().toArray(),
    [],
    [] as ActivityEntry[],
  )
}

export interface DbStats {
  workdays: number
  transactions: number
  projects: number
  contractors: number
  activity: number
}

export function useDbStats(): DbStats {
  return useLiveQuery(
    async () => ({
      workdays: await db.workdays.count(),
      transactions: await db.transactions.count(),
      projects: await db.projects.count(),
      contractors: await db.contractors.count(),
      activity: await db.activity.count(),
    }),
    [],
    { workdays: 0, transactions: 0, projects: 0, contractors: 0, activity: 0 },
  )
}

export interface StorageEstimate {
  usage: number
  quota: number
}

export function useStorageEstimate(): StorageEstimate | null {
  return useLiveQuery(
    async () => {
      if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null
      const est = await navigator.storage.estimate()
      return { usage: est.usage ?? 0, quota: est.quota ?? 0 }
    },
    [],
    null,
  )
}
