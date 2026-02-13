import { ReactNode } from "react"
import clsx from "clsx"

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-card text-card-foreground p-6 shadow-[0_5px_12px_rgba(6,10,18,0.14)]",
        className
      )}
    >
      {children}
    </div>
  )
}
