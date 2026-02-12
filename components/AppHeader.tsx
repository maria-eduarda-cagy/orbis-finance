"use client"
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"

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
      <h1 className="text-xl font-semibold">{title}</h1>
      <nav className="flex flex-wrap gap-2">
        {links.map((l) => {
          const active = pathname === l.href
          return (
            <Button key={l.href} onClick={() => (location.href = l.href)} disabled={active}>
              {l.label}
            </Button>
          )
        })}
      </nav>
    </header>
  )
}
