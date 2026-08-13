"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "./db"
import { DEFAULT_SETTINGS } from "./types"

export function useSettings() {
  return useLiveQuery(async () => {
    const s = await db.settings.get(1)
    return s ?? DEFAULT_SETTINGS
  }, [], DEFAULT_SETTINGS)
}

export function useWorkdays() {
  return useLiveQuery(
    () => db.workdays.orderBy("date").reverse().toArray(),
    [],
    [],
  )
}

export function useTransactions() {
  return useLiveQuery(
    () => db.transactions.orderBy("date").reverse().toArray(),
    [],
    [],
  )
}

export function useProjects() {
  return useLiveQuery(() => db.projects.orderBy("name").toArray(), [], [])
}

export function useContractors() {
  return useLiveQuery(() => db.contractors.orderBy("name").toArray(), [], [])
}
