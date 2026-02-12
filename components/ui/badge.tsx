import { HTMLAttributes } from "react"
import clsx from "clsx"

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-background-subtle text-muted-foreground px-2.5 py-1 text-xs ring-1 ring-border",
        className
      )}
      {...rest}
    />
  )
}
