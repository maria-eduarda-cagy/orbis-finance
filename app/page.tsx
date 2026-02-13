"use client"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"

export default function HomePage() {
  return (
    <main className="px-4 py-10 sm:py-16 space-y-16">
      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <Badge>Controle diário inteligente</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Um painel financeiro moderno para decisões rápidas e seguras
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Orbis Finance antecipa vencimentos, organiza faturas e transforma seus dados em projeções diárias claras.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/register">
              <Button className="glow">Começar agora</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-secondary text-secondary-foreground border border-border hover:brightness-110">Entrar</Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div>✔ Alertas inteligentes</div>
            <div>✔ Projeção diária</div>
            <div>✔ Controle por categoria</div>
          </div>
        </div>
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Saldo projetado</div>
            <Badge>Este mês</Badge>
          </div>
          <div className="text-3xl font-semibold">R$ 5.423,80</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-background-elevated p-3">
              <div className="text-muted-foreground">Receitas</div>
              <div className="font-semibold">R$ 9.120,00</div>
            </div>
            <div className="rounded-lg border border-border bg-background-elevated p-3">
              <div className="text-muted-foreground">Despesas</div>
              <div className="font-semibold">R$ 3.696,20</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background-subtle p-3 text-sm text-muted-foreground">
            Alertas de vencimento e status em tempo real.
          </div>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <h3 className="font-semibold">Visão Mensal</h3>
          <p className="text-sm text-muted-foreground mt-1">Receitas, despesas fixas e faturas em um só lugar.</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Saldo Diário</h3>
          <p className="text-sm text-muted-foreground mt-1">Allowance dinâmico com projeção por dia.</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Alertas no Telegram</h3>
          <p className="text-sm text-muted-foreground mt-1">Notificações com botões: pagar, adiar, abrir.</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Regras Recorrentes</h3>
          <p className="text-sm text-muted-foreground mt-1">Automação mensal sem reentrada manual.</p>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <h4 className="font-semibold">1. Configure</h4>
          <p className="text-sm text-muted-foreground mt-1">Adicione receitas, contas fixas e cartões.</p>
        </Card>
        <Card>
          <h4 className="font-semibold">2. Projete</h4>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe mês e dias com saldo previsto.</p>
        </Card>
        <Card>
          <h4 className="font-semibold">3. Aja</h4>
          <p className="text-sm text-muted-foreground mt-1">Receba alertas e marque pagamentos.</p>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="h-48 overflow-hidden">
            <img
              src="/preview-monthly.svg"
              alt="Preview do Dashboard Mensal"
              className="w-full h-full object-cover"
            />
          </Card>
          <Card className="h-48 overflow-hidden">
            <img
              src="/preview-daily.svg"
              alt="Preview do Dashboard Diário"
              className="w-full h-full object-cover"
            />
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
            <Button className="bg-secondary text-secondary-foreground border border-border hover:brightness-110">Entrar</Button>
          </Link>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto pt-8 border-t border-border text-muted-foreground text-sm flex items-center justify-between">
        <span>© {new Date().getFullYear()} Orbis Finance</span>
        <div className="flex gap-3">
          <Link href="/monthly">Dashboard</Link>
          <Link href="/import">Importar CSV</Link>
        </div>
      </footer>
    </main>
  )
}
