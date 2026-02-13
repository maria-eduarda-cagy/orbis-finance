"use client"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchMonthData, computeMonthlyProjection } from "../../../lib/projection"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts"
import { AppHeader } from "../../../components/AppHeader"
import { CardTransaction } from "../../../lib/types"

function formatMonth(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export default function MonthlyDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [hideNegative, setHideNegative] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [includeCarry, setIncludeCarry] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate])

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["month", month],
    queryFn: () => fetchMonthData(month),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always"
  })

  const investmentPercentage = useMemo(() => Number((data as { investmentPercentage?: number })?.investmentPercentage || 0), [data])
  const investmentMonthly = useMemo(() => {
    const totalIncome = (data?.incomes || []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    return (totalIncome * investmentPercentage) / 100
  }, [data, investmentPercentage])

  const totalBillsOnly = useMemo(() => {
    const bills = data?.bills || []
    return bills.reduce((s: number, r: { amount: number }) => s + r.amount, 0)
  }, [data])

  const proj = useMemo(() => {
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const statements = data?.statements || []
    return computeMonthlyProjection(incomes, bills, statements, 0, investmentMonthly)
  }, [data, investmentMonthly])

  const prevNet = useMemo(() => {
    const createdAt = data?.userCreatedAt ? new Date(data.userCreatedAt) : null
    const createdMonth = createdAt ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}` : null
    if (createdMonth && month <= createdMonth) return 0
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const prevStatements = data?.prevStatements || []
    const prevTransactions = (data?.prevTransactions || []).reduce((s: number, r: { amount_brl: number }) => s + Number(r.amount_brl || 0), 0)
    const totalIncome = incomes.reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    const totalBills = bills.reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    const totalStatements = prevStatements.reduce((s: number, r: { amount_total: number }) => s + r.amount_total, 0) + prevTransactions
    return totalIncome - totalBills - totalStatements
  }, [data, month])

  const projWithCarry = useMemo(() => {
    if (!includeCarry) return proj
    return {
      ...proj,
      net: proj.net + prevNet
    }
  }, [proj, prevNet, includeCarry])

  const transactions = useMemo(() => {
    const list = (data?.transactions || []) as CardTransaction[]
    return hideNegative ? list.filter((t) => Number(t.amount_brl) >= 0) : list
  }, [data, hideNegative])

  const filteredTransactions = useMemo(() => {
    if (!selectedCategory) return transactions
    return transactions.filter((t) => (t.category || "Sem categoria") === selectedCategory)
  }, [transactions, selectedCategory])

  const totalsByCard = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of filteredTransactions) {
      const name = t.cards?.name || "Cartão"
      map.set(name, (map.get(name) || 0) + Number(t.amount_brl || 0))
    }
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }))
  }, [filteredTransactions])

  const totalsByCategoryAll = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      const name = t.category || "Sem categoria"
      map.set(name, (map.get(name) || 0) + Number(t.amount_brl || 0))
    }
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }))
  }, [transactions])

  const totalsByCategory = useMemo(() => {
    if (!selectedCategory) return totalsByCategoryAll
    return totalsByCategoryAll.filter((t) => t.name === selectedCategory)
  }, [totalsByCategoryAll, selectedCategory])

  const visibleTransactions = useMemo(() => {
    if (showAll) return filteredTransactions
    return filteredTransactions.slice(0, 20)
  }, [filteredTransactions, showAll])

  const barColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--chart-6)",
    "var(--chart-7)"
  ]

  function addMonth(delta: number) {
    const d = new Date(selectedDate)
    d.setMonth(d.getMonth() + delta)
    setSelectedDate(d)
  }

  return (
    <main className="p-4 space-y-6">
      <AppHeader title={`Dashboard Mensal — ${month}`} />
      <div className="flex flex-wrap gap-2">
        <Button className="bg-secondary text-secondary-foreground border border-border hover:brightness-110" onClick={() => addMonth(-1)}>
          Mês anterior
        </Button>
        <Button className="bg-secondary text-secondary-foreground border border-border hover:brightness-110" onClick={() => addMonth(1)}>
          Próximo mês
        </Button>
        <Button onClick={() => refetch()}>Atualizar</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Receitas</div>
          <div className="mt-2 text-2xl font-semibold">R$ {proj.totalIncome?.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Despesas Fixas</div>
          <div className="mt-2 text-2xl font-semibold">R$ {totalBillsOnly.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Investimentos</div>
          <div className="mt-2 text-2xl font-semibold">R$ {investmentMonthly.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">{investmentPercentage}% das receitas</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Cartões</div>
          <div className="mt-2 text-2xl font-semibold">R$ {proj.totalStatements?.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo Projetado</div>
          <div className={`mt-2 text-2xl font-semibold ${projWithCarry.net < 0 ? "text-danger" : "text-success"}`}>
            R$ {projWithCarry.net?.toFixed(2)}
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <label className="flex items-center gap-2 rounded-full border border-border bg-background-elevated px-3 py-2">
          <input type="checkbox" checked={includeCarry} onChange={(e) => setIncludeCarry(e.target.checked)} />
          Incluir saldo do mês anterior
        </label>
        <span>Saldo inicial (mês anterior): R$ {prevNet.toFixed(2)}</span>
      </div>

      <Card className="h-80">
        <div className="flex items-center justify-between px-4 pt-3">
          <div>
            <div className="text-sm text-foreground">Gastos por categoria (R$)</div>
            <div className="text-xs text-muted-foreground">Clique em uma barra para filtrar.</div>
          </div>
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <Badge>{selectedCategory}</Badge>
              <Button
                className="bg-secondary text-secondary-foreground border border-border hover:brightness-110"
                onClick={() => setSelectedCategory(null)}
              >
                Limpar
              </Button>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={totalsByCategoryAll}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}`} />
            <Tooltip
              formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              contentStyle={{
                background: "var(--background-elevated)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                borderRadius: 8
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Bar
              dataKey="total"
              activeBar={{ fillOpacity: 0.4 }}
              onClick={(data) => {
                const name = data?.name as string | undefined
                if (!name) return
                setSelectedCategory((current) => (current === name ? null : name))
              }}
            >
              {totalsByCategoryAll.map((item, index) => {
                const isSelected = selectedCategory ? item.name === selectedCategory : true
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColors[index % barColors.length]}
                    fillOpacity={isSelected ? 1 : 0.3}
                    style={{ cursor: "pointer" }}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {isLoading && <div>Carregando...</div>}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gastos do Cartão</h2>
            <p className="text-sm text-muted-foreground">Visualize itens detalhados por categoria.</p>
          </div>
          {selectedCategory && <Badge className="text-foreground">{selectedCategory}</Badge>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2 rounded-full border border-border bg-background-elevated px-3 py-2">
            <input type="checkbox" checked={hideNegative} onChange={(e) => setHideNegative(e.target.checked)} />
            Ocultar valores negativos (pagamentos)
          </label>
          {filteredTransactions.length > 20 && (
            <Button className="bg-secondary text-secondary-foreground border border-border hover:brightness-110" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Mostrar menos" : "Mostrar todos"}
            </Button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Card>
            <div className="font-medium text-foreground">Total por cartão</div>
            <div className="mt-2 space-y-1">
              {totalsByCard.length === 0 && <div className="text-muted-foreground">Sem dados.</div>}
              {totalsByCard.map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span>{t.name}</span>
                  <span className="font-semibold">R$ {t.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="font-medium text-foreground">Total por categoria</div>
            <div className="mt-2 space-y-1">
              {totalsByCategory.length === 0 && <div className="text-muted-foreground">Sem dados.</div>}
              {totalsByCategory.map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span>{t.name}</span>
                  <span className="font-semibold">R$ {t.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          {filteredTransactions.length === 0 && <div className="text-muted-foreground">Sem lançamentos.</div>}
          {visibleTransactions.map((t: CardTransaction) => (
            <div key={t.id} className="flex flex-col gap-1 rounded-lg border border-border bg-background-elevated p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-foreground">
                  {t.cards?.name || "Cartão"} • {t.purchase_date}
                </div>
                <div className={`${t.amount_brl < 0 ? "text-success" : "text-danger"} font-semibold`}>
                  R$ {Number(t.amount_brl).toFixed(2)}
                </div>
              </div>
              <div className="text-secondary-foreground">{t.description || "-"}</div>
              <div className="text-muted-foreground">
                {t.category || "-"} {t.installment ? `• ${t.installment}` : ""}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  )
}
