import { ButtonHTMLAttributes } from "react"
import clsx from "clsx"

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, children, ...rest } = props
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-[0_5px_12px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_7px_14px_rgba(15,23,42,0.2)] active:translate-y-0 active:shadow-[0_4px_10px_rgba(15,23,42,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:pointer-events-none",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
