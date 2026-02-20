"use client"
import clsx from "clsx"
import { Eye, EyeOff } from "lucide-react"
import { useNumberVisibility } from "./NumberVisibilityProvider"

export function NumberToggle({ className }: { className?: string }) {
  const { hidden, toggle } = useNumberVisibility()
  return (
    <button
      type="button"
      onClick={toggle}
      title={hidden ? "Ocultar números: ativado" : "Ocultar números: desativado"}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full bg-background-elevated px-3 py-2 text-sm font-semibold shadow-[0_3px_8px_rgba(6,10,18,0.1)] transition-colors hover:bg-background-subtle",
        className
      )}
    >
      {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
      <span className="hidden sm:inline">{hidden ? "Ocultando" : "Visível"}</span>
    </button>
  )
}
