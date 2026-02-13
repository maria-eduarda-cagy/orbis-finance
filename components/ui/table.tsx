import { HTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "w-full overflow-x-auto rounded-2xl bg-background-elevated shadow-[0_5px_12px_rgba(6,10,18,0.14)]",
        className
      )}
    >
      {children}
    </div>
  )
}

export function THead({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "sticky top-0 grid grid-cols-12 gap-2 bg-background-subtle text-muted-foreground backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TRow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "grid grid-cols-12 gap-2 hover:bg-background-subtle/70 transition-colors",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TCell(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={clsx("px-4 py-3 text-sm", className)} {...rest} />
}

export function Amount({ value }: { value: number }) {
  const negative = value < 0
  return <span className={clsx("tabular-nums font-medium", negative ? "text-danger" : "text-success")}>{value.toFixed(2)}</span>
}
