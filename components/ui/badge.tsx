import { HTMLAttributes } from "react"
import clsx from "clsx"

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-background-subtle text-muted-foreground px-3 py-1 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        className
      )}
      {...rest}
    />
  )
}
