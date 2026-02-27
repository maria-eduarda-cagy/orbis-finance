"use client"
import { useMemo, useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { fetchMonthData, computeMonthlyProjection } from "../../../lib/projection"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts"
import { AppHeader } from "../../../components/AppHeader"
import { VariableExpense, CardTransaction, BankTransfer } from "../../../lib/types"
import { totalVariableExpensesForMonth } from "../../../lib/variableExpenses"
import { formatMonth, formatMonthTitle } from "../../../utils/date"
import { normalizeCategory } from "../../../utils/category"
import { CurrencyText } from "../../../components/format/CurrencyText"
import { useNumberVisibility } from "../../../components/visibility/NumberVisibilityProvider"
import { LoaderInline, LoadingCard, UpdatingOverlay } from "../../../components/ui/loader"

export default function MonthlyDashboard() {
  const { hidden } = useNumberVisibility()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [hideNegative, setHideNegative] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [includeCarry, setIncludeCarry] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate])

  const { data, refetch, isLoading, isFetching } = useQuery({
    queryKey: ["month", month],
    queryFn: () => fetchMonthData(month),
    placeholderData: keepPreviousData,
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

  const variableExpensesTotal = useMemo(() => {
    const list = ((data as { variableExpenses?: VariableExpense[] })?.variableExpenses || []) as VariableExpense[]
    return totalVariableExpensesForMonth(list, month)
  }, [data, month])

  const proj = useMemo(() => {
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const statements = data?.statements || []
    const monthlyIncomesTotal = ((data as { monthlyIncomes?: Array<{ amount: number }> })?.monthlyIncomes || []).reduce(
      (s: number, r: { amount: number }) => s + Number(r.amount || 0),
      0
    )
    return computeMonthlyProjection(incomes, bills, statements, monthlyIncomesTotal, investmentMonthly + variableExpensesTotal)
  }, [data, investmentMonthly, variableExpensesTotal])

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
    return transactions.filter((t) => normalizeCategory(t.category) === selectedCategory)
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
      const name = normalizeCategory(t.category)
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
    return filteredTransactions.slice(0, 12)
  }, [filteredTransactions, showAll])

  const transfers = useMemo(() => (data?.transfers || []) as BankTransfer[], [data])

  const transferTotals = useMemo(() => {
    const incoming = transfers.reduce((s, t) => s + (t.direction === "entrada" ? Number(t.amount) : 0), 0)
    const outgoing = transfers.reduce((s, t) => s + (t.direction === "saida" ? Number(t.amount) : 0), 0)
    return { incoming, outgoing, net: incoming - outgoing }
  }, [transfers])

  const transfersByBank = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transfers) {
      const name = t.bank_name || "Banco"
      const delta = t.direction === "entrada" ? Number(t.amount) : -Number(t.amount)
      map.set(name, (map.get(name) || 0) + delta)
    }
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }))
  }, [transfers])

  const barColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--chart-6)",
    "var(--chart-7)",
    "#4DD0FF",
    "#FF8D5C",
    "#C47BFF",
    "#8BE36E",
    "#FFC857",
    "#6F8CFF",
    "#FF6FB1"
  ]

  function addMonth(delta: number) {
    const d = new Date(selectedDate)
    d.setMonth(d.getMonth() + delta)
    setSelectedDate(d)
  }

  return (
    <main className="p-4 space-y-6">
      <AppHeader title={`Dashboard Mensal — ${formatMonthTitle(month)}`} />
      {((!data && isLoading) ||
        (isFetching &&
          data &&
          ((data.incomes?.length || 0) +
            (data.bills?.length || 0) +
            (data.statements?.length || 0) +
            (data.transactions?.length || 0) +
            (data.transfers?.length || 0) +
            ((data.monthlyIncomes?.length || 0) + (data.variableExpenses?.length || 0))) === 0)) && (
        <UpdatingOverlay label="Atualizando dados..." />
      )}
      <div className="flex flex-wrap gap-2">
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(-1)}>
          Mês anterior
        </Button>
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(1)}>
          Próximo mês
        </Button>
        
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Receitas</div>
          <div className="mt-2 text-2xl font-semibold"><CurrencyText value={proj.totalIncome || 0} /></div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Despesas Fixas</div>
          <div className="mt-2 text-2xl font-semibold"><CurrencyText value={totalBillsOnly} /></div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Investimentos</div>
          <div className="mt-2 text-2xl font-semibold"><CurrencyText value={investmentMonthly} /></div>
          <div className="text-xs text-muted-foreground mt-1">{investmentPercentage}% das receitas</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Cartões</div>
          <div className="mt-2 text-2xl font-semibold"><CurrencyText value={proj.totalStatements || 0} /></div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo Projetado</div>
          <div className={`mt-2 text-2xl font-semibold ${projWithCarry.net < 0 ? "text-danger" : "text-success"}`}>
            <CurrencyText value={projWithCarry.net || 0} />
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <label className="flex items-center gap-2 rounded-full bg-background-elevated px-3 py-2 shadow-[0_3px_8px_rgba(6,10,18,0.1)]">
          <input type="checkbox" checked={includeCarry} onChange={(e) => setIncludeCarry(e.target.checked)} />
          Incluir saldo do mês anterior
        </label>
        <span>Saldo inicial (mês anterior): <CurrencyText value={prevNet} /></span>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-foreground font-semibold">Gastos por categoria</div>
            <div className="text-xs text-muted-foreground">Clique em uma barra para filtrar.</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-14 rounded-full bg-[var(--chart-1)]" />
            <span className="h-1.5 w-10 rounded-full bg-[var(--chart-2)]" />
            <span className="h-1.5 w-12 rounded-full bg-[var(--chart-4)]" />
          </div>
        </div>
      </div>

      <Card className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={totalsByCategoryAll}
            barCategoryGap={22}
            onClick={(e) => {
              const payload = (e as { activePayload?: Array<{ payload?: { name?: string } }> })?.activePayload?.[0]?.payload
              const name = payload?.name
              if (!name) return
              setSelectedCategory((current) => (current === name ? null : name))
            }}
          >
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => (hidden ? "-" : `${Number(v).toFixed(0)}`)} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(79,124,255,0.08)" }}
              formatter={(value) => (hidden ? `R$ -` : `R$ ${Number(value).toFixed(2)}`)}
              contentStyle={{
                background: "var(--background-elevated)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                borderRadius: 8
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Bar dataKey="total" activeBar={{ fillOpacity: 0.4 }} radius={[10, 10, 6, 6]}>
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

      {selectedCategory && (
        <div className="flex items-center gap-2">
          <Badge>{selectedCategory}</Badge>
          <Button
            className="bg-secondary text-secondary-foreground hover:brightness-110"
            onClick={() => setSelectedCategory(null)}
          >
            Limpar filtro
          </Button>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gastos do Cartão</h2>
            <p className="text-sm text-muted-foreground">Resumo por cartão e categoria.</p>
          </div>
          {selectedCategory && <Badge className="text-foreground">{selectedCategory}</Badge>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2 rounded-full bg-background-elevated px-3 py-2 shadow-[0_3px_8px_rgba(6,10,18,0.1)]">
            <input type="checkbox" checked={hideNegative} onChange={(e) => setHideNegative(e.target.checked)} />
            Ocultar valores negativos (pagamentos)
          </label>
          {filteredTransactions.length > 12 && (
            <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => setShowAll((v) => !v)}>
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
                  <span className="font-semibold"><CurrencyText value={t.total} /></span>
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
                  <span className="font-semibold"><CurrencyText value={t.total} /></span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Transferências bancárias</h2>
            <p className="text-sm text-muted-foreground">Entradas e saídas do mês.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <Card>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Entradas</div>
            <div className="mt-2 text-xl font-semibold text-success"><CurrencyText value={transferTotals.incoming} /></div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Saídas</div>
            <div className="mt-2 text-xl font-semibold text-danger"><CurrencyText value={transferTotals.outgoing} /></div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</div>
            <div className="mt-2 text-xl font-semibold"><CurrencyText value={transferTotals.net} /></div>
          </Card>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Card>
            <div className="font-medium text-foreground">Total por banco</div>
            <div className="mt-2 space-y-1">
              {transfersByBank.length === 0 && <div className="text-muted-foreground">Sem dados.</div>}
              {transfersByBank.map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span>{t.name}</span>
                  <span className="font-semibold"><CurrencyText value={t.total} /></span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="font-medium text-foreground">Últimas transferências</div>
            <div className="mt-2 space-y-2">
              {transfers.length === 0 && <div className="text-muted-foreground">Sem transferências.</div>}
              {transfers.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.transfer_date}</span>
                  <span className={t.direction === "entrada" ? "text-success" : "text-danger"}>
                    <CurrencyText value={Number(t.amount)} />
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>

      
    </main>
  )
}
