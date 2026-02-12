import { forwardRef, InputHTMLAttributes } from "react"
import clsx from "clsx"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  props,
  ref
) {
  const { className, ...rest } = props
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand",
        className
      )}
      {...rest}
    />
  )
})
