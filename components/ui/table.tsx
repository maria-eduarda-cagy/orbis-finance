import { HTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("w-full overflow-x-auto rounded-xl border border-border bg-background-elevated", className)}>{children}</div>
}

export function THead({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("sticky top-0 grid grid-cols-12 gap-2 border-b border-border bg-background-subtle text-muted-foreground backdrop-blur", className)}>{children}</div>
}

export function TRow({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("grid grid-cols-12 gap-2 border-b border-border hover:bg-background-subtle transition-colors", className)}>{children}</div>
}

export function TCell(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={clsx("px-4 py-3 text-sm", className)} {...rest} />
}

export function Amount({ value }: { value: number }) {
  const negative = value < 0
  return <span className={clsx("tabular-nums font-medium", negative ? "text-danger" : "text-success")}>{value.toFixed(2)}</span>
}
