"use client"
import { ChangeEvent, useMemo } from "react"
import { Input } from "../ui/input"
import { daysInMonth } from "../../utils/date"

type Props = {
  month: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  id: string
  placeholder?: string
}

export function DayOfMonthInput({ month, value, onChange, id, placeholder = "Dia do mês" }: Props) {
  const { daysCount, options } = useMemo(() => {
    const d = new Date(`${month}-01`)
    const count = Number.isFinite(d.getTime()) ? daysInMonth(d) : 31
    const opts = Array.from({ length: count }, (_, i) => i + 1)
    return { daysCount: count, options: opts }
  }, [month])

  return (
    <>
      <Input type="number" min="1" max={daysCount} step="1" list={id} value={value} onChange={onChange} placeholder={placeholder} />
      <datalist id={id}>
        {options.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
    </>
  )
}
