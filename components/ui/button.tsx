import { ButtonHTMLAttributes } from "react"
import clsx from "clsx"

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, children, ...rest } = props
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-subtle transition-all hover:brightness-110 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
