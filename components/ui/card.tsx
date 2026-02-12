import { ReactNode } from "react"
import clsx from "clsx"

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm", className)}>
      {children}
    </div>
  )
}
