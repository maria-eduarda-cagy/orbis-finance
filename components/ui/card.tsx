import { ReactNode } from "react"
import clsx from "clsx"

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-xl border border-border bg-card text-card-foreground p-5 shadow-card", className)}>
      {children}
    </div>
  )
}
