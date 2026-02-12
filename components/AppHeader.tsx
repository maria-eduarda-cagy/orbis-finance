"use client"
import { usePathname } from "next/navigation"
import clsx from "clsx"

const links = [
  { href: "/dashboard/month", label: "Mensal" },
  { href: "/dashboard/day", label: "Diário" },
  { href: "/import", label: "Importar" },
  { href: "/settings", label: "Configurações" }
]

export function AppHeader({ title }: { title: string }) {
  const pathname = usePathname()

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <nav className="flex flex-wrap gap-2">
        {links.map((l) => {
          const active = pathname === l.href
          return (
            <button
              key={l.href}
              onClick={() => (location.href = l.href)}
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors border",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-background-elevated"
              )}
            >
              {l.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
