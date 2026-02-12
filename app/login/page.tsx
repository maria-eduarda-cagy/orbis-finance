"use client"
import { useState, ChangeEvent } from "react"
import { getSupabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setLoading(true)
    setError(null)
    const { error: err } = await getSupabase().auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError("Falha ao entrar")
      return
    }
    router.push("/dashboard/month")
  }

  return (
    <main className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <div className="space-y-2">
        <label className="text-sm">Email</label>
        <Input type="email" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Senha</label>
        <Input type="password" value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button onClick={onSubmit} disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </main>
  )
}
