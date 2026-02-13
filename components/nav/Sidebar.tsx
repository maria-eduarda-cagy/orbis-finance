"use client"
import { useMemo, useState } from "react"
import { CalendarDays, CalendarRange, Settings, LogOut, CreditCard, Landmark, Sliders } from "lucide-react"
import { NavLink } from "./NavLink"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { getSupabase } from "../../lib/supabaseClient"

type SidebarProps = {
  userName: string
  userEmail: string
  onProfileUpdate?: (name: string) => void
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U"
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase()
}

export function Sidebar({ userName, userEmail, onProfileUpdate }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(userName)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loadingName, setLoadingName] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const initials = useMemo(() => initialsFrom(userName), [userName])

  async function saveName() {
    setError(null)
    setInfo(null)
    if (!name.trim()) {
      setError("Informe um nome válido.")
      return
    }
    setLoadingName(true)
    const supabase = getSupabase()
    const { error: err } = await supabase.auth.updateUser({ data: { name: name.trim() } })
    setLoadingName(false)
    if (err) {
      setError(err.message || "Falha ao atualizar nome.")
      return
    }
    onProfileUpdate?.(name.trim())
    setInfo("Nome atualizado.")
  }

  async function changePassword() {
    setError(null)
    setInfo(null)
    if (!currentPassword || !newPassword) {
      setError("Preencha a senha atual e a nova senha.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação da senha não confere.")
      return
    }
    setLoadingPassword(true)
    const supabase = getSupabase()
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword
    })
    if (reauthErr) {
      setLoadingPassword(false)
      setError("Senha atual inválida.")
      return
    }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    setLoadingPassword(false)
    if (updateErr) {
      setError(updateErr.message || "Falha ao atualizar senha.")
      return
    }
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setInfo("Senha atualizada.")
  }

  async function logout() {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:bg-gradient-to-b md:from-background-elevated md:via-background-elevated md:to-background-subtle">
      <div className="flex h-full flex-col px-5 py-6 text-[17px]">
        <div className="text-2xl font-semibold tracking-tight text-foreground">Orbis Finance</div>
        <div className="mt-6 space-y-0">
          <NavLink href="/monthly" label="Dashboard Mensal" icon={<CalendarRange size={18} />} />
          <NavLink href="/daily" label="Dashboard Diário" icon={<CalendarDays size={18} />} />
          <NavLink href="/accounts" label="Conta Bancária" icon={<Landmark size={18} />} />
          <NavLink href="/cards" label="Gastos do Cartão" icon={<CreditCard size={18} />} />
          <NavLink href="/preferences" label="Preferências" icon={<Sliders size={18} />} />
          <NavLink href="/settings" label="Configurações" icon={<Settings size={18} />} />
        </div>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => {
              setName(userName)
              setOpen(true)
            }}
            className="flex w-full items-center gap-3 rounded-xl bg-background-subtle/70 px-3 py-3 text-left hover:bg-background-elevated/80 transition-colors cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-semibold shadow-[0_3px_8px_rgba(15,23,42,0.12)]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{userName}</div>
              <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-background-elevated px-3 py-2 text-sm font-semibold text-foreground hover:bg-background-subtle/80 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfil</DialogTitle>
            <div className="text-sm text-muted-foreground">Atualize seu nome e senha.</div>
          </DialogHeader>

          <div className="mt-5 space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              <Button onClick={saveName} disabled={loadingName}>
                {loadingName ? "Salvando..." : "Salvar nome"}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Senha atual</label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <label className="text-sm text-muted-foreground">Nova senha</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <label className="text-sm text-muted-foreground">Confirmar nova senha</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <Button onClick={changePassword} disabled={loadingPassword}>
                {loadingPassword ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </div>

            {error && <div className="text-danger text-sm">{error}</div>}
            {info && <div className="text-success text-sm">{info}</div>}
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
