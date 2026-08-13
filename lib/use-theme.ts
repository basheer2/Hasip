"use client"

import { useCallback, useEffect, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"

function apply(mode: ThemeMode) {
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  const c = document.documentElement.classList
  c.remove("light", "dark")
  c.add(dark ? "dark" : "light")
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("system")

  useEffect(() => {
    const stored = (localStorage.getItem("app-theme") as ThemeMode) || "system"
    setThemeState(stored)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if ((localStorage.getItem("app-theme") || "system") === "system") {
        apply("system")
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const setTheme = useCallback((mode: ThemeMode) => {
    localStorage.setItem("app-theme", mode)
    setThemeState(mode)
    apply(mode)
  }, [])

  return { theme, setTheme }
}
