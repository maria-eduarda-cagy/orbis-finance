"use client"
import { useEffect, useState } from "react"
import { AppHeader } from "../../../components/AppHeader"
import { Card } from "../../../components/ui/card"
import { ThemeToggle } from "../../../components/theme/ThemeToggle"

export default function PreferencesPage() {
  return (
    <main className="p-4 space-y-6">
      <AppHeader title="Preferências" />

      <Card>
        <div className="text-lg font-semibold">Tema</div>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </Card>
    </main>
  )
}
