"use client"
import { ChangeEvent } from "react"
import { Input } from "../ui/input"

type Props = {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export function MoneyInput({ value, onChange, placeholder = "Valor", className }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
      <Input type="number" inputMode="decimal" step="0.01" min="0" value={value} onChange={onChange} placeholder={placeholder} className={`pl-8 ${className || ""}`} />
    </div>
  )
}
