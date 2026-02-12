import { HTMLAttributes } from "react"
import clsx from "clsx"

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-neutral-800 text-neutral-200 px-2.5 py-1 text-xs ring-1 ring-neutral-700",
        className
      )}
      {...rest}
    />
  )
}
