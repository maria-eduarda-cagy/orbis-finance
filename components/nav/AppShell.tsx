"use client"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { getSupabase } from "../../lib/supabaseClient"
import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"

type AppShellProps = {
  children: ReactNode
}

type UserState = {
  name: string
  email: string
}

function fallbackName(email: string) {
  if (!email) return "Usuário"
  return email.split("@")[0] || "Usuário"
}

export function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<UserState>({ name: "Usuário", email: "" })

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getUser()
      const authUser = data.user
      const email = authUser?.email || ""
      const name = String(authUser?.user_metadata?.name || "").trim() || fallbackName(email)
      setUser({ name, email })
    }
    loadUser()
  }, [])

  const userName = useMemo(() => user.name || "Usuário", [user.name])
  const userEmail = useMemo(() => user.email || "", [user.email])

  return (
    <div className="min-h-screen bg-background text-foreground md:pl-64">
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        onProfileUpdate={(name) => setUser((prev) => ({ ...prev, name }))}
      />
      <div className="min-h-screen">
        <MobileNav userName={userName} userEmail={userEmail} />
        {children}
      </div>
    </div>
  )
}
