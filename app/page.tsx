"use client"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"

export default function HomePage() {
  return (
    <main className="px-4 py-10 sm:py-16 space-y-16">
      <section className="max-w-4xl mx-auto text-center space-y-5">
        <Badge className="mx-auto">Controle diário inteligente</Badge>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Projeção financeira mensal e diária com alertas via Telegram
        </h1>
        <p className="text-neutral-300 max-w-2xl mx-auto">
          Orbis Finance ajuda você a antecipar vencimentos, controlar faturas de cartão e manter um allowance diário saudável.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register">
            <Button className="glow">Começar agora</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-neutral-800 hover:bg-neutral-700">Entrar</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <h3 className="font-semibold">Visão Mensal</h3>
          <p className="text-sm text-neutral-300 mt-1">Receitas, despesas fixas e faturas em um só lugar.</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Saldo Diário</h3>
          <p className="text-sm text-neutral-300 mt-1">Allowance dinâmico com projeção por dia.</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Alertas no Telegram</h3>
          <p className="text-sm text-neutral-300 mt-1">Notificações com botões: pagar, adiar, abrir.</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Regras Recorrentes</h3>
          <p className="text-sm text-neutral-300 mt-1">Automação mensal sem reentrada manual.</p>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <h4 className="font-semibold">1. Configure</h4>
          <p className="text-sm text-neutral-300 mt-1">Adicione receitas, contas fixas e cartões.</p>
        </Card>
        <Card>
          <h4 className="font-semibold">2. Projete</h4>
          <p className="text-sm text-neutral-300 mt-1">Acompanhe mês e dias com saldo previsto.</p>
        </Card>
        <Card>
          <h4 className="font-semibold">3. Aja</h4>
          <p className="text-sm text-neutral-300 mt-1">Receba alertas e marque pagamentos.</p>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="h-48">
            <div className="h-full flex items-center justify-center text-neutral-400">Preview Dashboard Mensal</div>
          </Card>
          <Card className="h-48">
            <div className="h-full flex items-center justify-center text-neutral-400">Preview Dashboard Diário</div>
          </Card>
        </div>
      </section>

      <section className="max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-semibold">Pronto para assumir o controle?</h2>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register">
            <Button className="glow">Começar agora</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-neutral-800 hover:bg-neutral-700">Entrar</Button>
          </Link>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto pt-8 border-t border-neutral-800 text-neutral-400 text-sm flex items-center justify-between">
        <span>© {new Date().getFullYear()} Orbis Finance</span>
        <div className="flex gap-3">
          <Link href="/dashboard/month">Dashboard</Link>
          <Link href="/import">Importar CSV</Link>
        </div>
      </footer>
    </main>
  )
}
