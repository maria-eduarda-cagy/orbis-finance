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
        "w-full rounded-md border border-border bg-input text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm shadow-subtle focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        className
      )}
      {...rest}
    />
  )
})
