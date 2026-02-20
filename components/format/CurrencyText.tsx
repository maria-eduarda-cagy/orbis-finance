"use client"
import clsx from "clsx"
import { useNumberVisibility } from "../visibility/NumberVisibilityProvider"

export function CurrencyText({ value, className }: { value: number; className?: string }) {
  const { hidden } = useNumberVisibility()
  return <span className={clsx("tabular-nums", className)}>R$ {hidden ? "-" : Number(value).toFixed(2)}</span>
}

export function NumberText({ value, className }: { value: number; className?: string }) {
  const { hidden } = useNumberVisibility()
  return <span className={clsx("tabular-nums", className)}>{hidden ? "-" : Number(value).toFixed(2)}</span>
}
