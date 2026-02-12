"use client"
import { useState } from "react"
import { Menu, Download, Settings } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet"
import { NavLink } from "./NavLink"

type MobileNavProps = {
  userName: string
  userEmail: string
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U"
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase()
}

export function MobileNav({ userName, userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden border-b border-border bg-background-elevated">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background-subtle text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
        <div className="text-sm font-semibold">Orbis Finance</div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          {initialsFrom(userName)}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <div className="text-sm text-muted-foreground">{userName}</div>
            <div className="text-xs text-muted-foreground">{userEmail}</div>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            <NavLink href="/import" label="Importar Fatura" icon={<Download size={18} />} onClick={() => setOpen(false)} />
            <NavLink href="/settings" label="Configurações" icon={<Settings size={18} />} onClick={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
