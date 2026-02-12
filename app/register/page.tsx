"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "../../lib/supabaseClient"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import Link from "next/link"

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres")
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormData) {
    setMessage(null)
    setError(null)
    const supabase = getSupabase()
    const { data, error: err } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { name: values.name } }
    })
    if (err) {
      setError(err.message || "Falha no cadastro")
      return
    }
    if (data?.user?.identities?.length === 0) {
      setError("Email já cadastrado. Faça login.")
      return
    }
    if (!data?.session) {
      setMessage("Cadastro realizado. Verifique seu email para confirmar a conta antes de entrar.")
      return
    }
    setMessage("Cadastro realizado. Você já pode entrar.")
    setTimeout(() => router.push("/login"), 1000)
  }

  return (
    <main className="px-4 py-10">
      <div className="max-w-sm mx-auto">
        <Card className="p-6">
          <div className="mb-4">
            <h1 className="text-xl font-semibold">Criar conta</h1>
            <p className="text-sm text-muted-foreground">Comece a acompanhar suas metas e projeções.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm text-muted-foreground">Nome</label>
              <Input placeholder="Seu nome" {...register("name")} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input type="email" placeholder="voce@exemplo.com" {...register("email")} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Senha</label>
              <Input type="password" placeholder="••••••" {...register("password")} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            {message && <p className="text-success text-sm">{message}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Enviando..." : "Cadastrar"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4">
            Já possui conta? <Link href="/login" className="text-primary hover:brightness-110">Entrar</Link>
          </p>
        </Card>
      </div>
    </main>
  )
}
