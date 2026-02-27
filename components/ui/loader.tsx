"use client"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export function LoaderInline({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="rounded-2xl bg-card text-card-foreground p-6 shadow-[0_5px_12px_rgba(6,10,18,0.14)] animate-pulse">
      <div className="h-4 w-36 bg-background-subtle rounded mb-3" />
      <div className="h-6 w-64 bg-background-subtle rounded" />
    </div>
  )
}

export function UpdatingOverlay({ label = "Atualizando dados..." }: { label?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    const prevOverflowHtml = document.documentElement.style.overflow
    const prevOverflowBody = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = prevOverflowHtml
      document.body.style.overflow = prevOverflowBody
    }
  }, [])
  if (typeof window === "undefined" || !mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] m-0 p-0 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-card p-5 text-card-foreground shadow-[0_10px_24px_rgba(6,10,18,0.28)]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div className="text-sm font-medium">{label}</div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Isso leva apenas alguns instantes.</div>
      </div>
    </div>,
    document.body
  )
}
