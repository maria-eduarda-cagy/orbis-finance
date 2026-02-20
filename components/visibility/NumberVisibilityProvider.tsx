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
  if (typeof window === "undefined") return false
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === "1"
}

export function NumberVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState<boolean>(() => getInitialHidden())

  useEffect(() => {
    if (hidden) {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
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
