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
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada e acionável das suas finanças.</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {links.map((l) => {
          const active = pathname === l.href
          return (
            <button
              key={l.href}
              onClick={() => (location.href = l.href)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition-all border",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                  : "bg-background-elevated text-secondary-foreground border-border hover:bg-background-subtle"
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
