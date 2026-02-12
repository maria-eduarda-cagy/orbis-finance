import { ReactNode } from "react"
import clsx from "clsx"

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-lg border border-border bg-card text-card-foreground p-4 shadow-card", className)}>
      {children}
    </div>
  )
}
