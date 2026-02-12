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
        "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background-elevated text-foreground border-border hover:bg-background-subtle"
      )}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
    </Link>
  )
}
