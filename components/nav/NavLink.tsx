"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { ReactNode } from "react"

type NavLinkProps = {
  href: string
  icon?: ReactNode
  label: string
  onClick?: () => void
}

export function NavLink({ href, icon, label, onClick }: NavLinkProps) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[16px] font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden",
        active
          ? "bg-primary/14 text-foreground hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-primary/10 hover:via-accent/10 hover:to-background-subtle"
          : "bg-background-elevated text-foreground hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-primary/10 hover:via-accent/10 hover:to-background-subtle hover:text-foreground"
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary" />}
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
    </Link>
  )
}
