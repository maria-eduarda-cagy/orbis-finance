"use client"
import { useState, ChangeEvent } from "react"
import { getSupabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card } from "../../components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function onSubmit() {
    setLoading(true)
    setError(null)
    setInfo(null)
    const { error: err } = await getSupabase().auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message || "Falha ao entrar")
      return
    }
    router.push("/dashboard/month")
  }

  async function onResetPassword() {
    setError(null)
    setInfo(null)
    if (!email) {
      setError("Informe o email para recuperar a senha.")
      return
    }
    setResetLoading(true)
    const { error: err } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    setResetLoading(false)
    if (err) {
      setError(err.message || "Falha ao enviar email de recuperação.")
      return
    }
    setInfo("Email de recuperação enviado. Verifique sua caixa de entrada.")
  }

  return (
    <main className="px-4 py-10">
      <div className="max-w-sm mx-auto">
        <Card className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Entrar</h1>
            <p className="text-sm text-muted-foreground">Acesse sua conta e acompanhe suas projeções.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Email</label>
            <Input type="email" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Senha</label>
            <Input type="password" value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          {info && <p className="text-success text-sm">{info}</p>}
          <Button onClick={onSubmit} disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <button
            type="button"
            onClick={onResetPassword}
            disabled={resetLoading}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {resetLoading ? "Enviando..." : "Esqueci minha senha"}
          </button>
        </Card>
      </div>
    </main>
  )
}
