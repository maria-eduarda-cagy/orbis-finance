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
        "w-full rounded-lg bg-background-subtle text-foreground placeholder:text-muted-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        className
      )}
      {...rest}
    />
  )
})
