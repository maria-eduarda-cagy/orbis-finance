import { ButtonHTMLAttributes } from "react"
import clsx from "clsx"

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, children, ...rest } = props
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md bg-brand dark:bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
