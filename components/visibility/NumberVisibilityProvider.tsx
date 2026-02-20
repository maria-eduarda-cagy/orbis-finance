"use client"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type ContextValue = {
  hidden: boolean
  setHidden: (v: boolean) => void
  toggle: () => void
}

const Ctx = createContext<ContextValue | null>(null)
const STORAGE_KEY = "orbis-hide-numbers"

function getInitialHidden(): boolean {
  // Para evitar hydration mismatch, sempre começamos com false no SSR e no primeiro render do cliente.
  return false
}

export function NumberVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState<boolean>(() => getInitialHidden())

  useEffect(() => {
    // Sincroniza a partir do localStorage após montar no cliente
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === "1") setHidden(true)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (hidden) {
        window.localStorage.setItem(STORAGE_KEY, "1")
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}
  }, [hidden])

  const value = useMemo<ContextValue>(
    () => ({
      hidden,
      setHidden,
      toggle: () => setHidden((v) => !v)
    }),
    [hidden]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNumberVisibility() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useNumberVisibility must be used within NumberVisibilityProvider")
  return ctx
}
