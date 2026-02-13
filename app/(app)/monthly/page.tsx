"use client"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchMonthData, computeMonthlyProjection } from "../../../lib/projection"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { AppHeader } from "../../../components/AppHeader"
import { VariableExpense } from "../../../lib/types"
import { totalVariableExpensesForMonth } from "../../../lib/variableExpenses"

function formatMonth(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export default function MonthlyDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [includeCarry, setIncludeCarry] = useState(true)
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

  const variableExpensesTotal = useMemo(() => {
    const list = ((data as { variableExpenses?: VariableExpense[] })?.variableExpenses || []) as VariableExpense[]
    return totalVariableExpensesForMonth(list, month)
  }, [data, month])

  const proj = useMemo(() => {
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const statements = data?.statements || []
    return computeMonthlyProjection(incomes, bills, statements, 0, investmentMonthly + variableExpensesTotal)
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

  function addMonth(delta: number) {
    const d = new Date(selectedDate)
    d.setMonth(d.getMonth() + delta)
    setSelectedDate(d)
  }

  return (
    <main className="p-4 space-y-6">
      <AppHeader title={`Dashboard Mensal — ${month}`} />
      <div className="flex flex-wrap gap-2">
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(-1)}>
          Mês anterior
        </Button>
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(1)}>
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
        <label className="flex items-center gap-2 rounded-full bg-background-elevated px-3 py-2 shadow-[0_3px_8px_rgba(6,10,18,0.1)]">
          <input type="checkbox" checked={includeCarry} onChange={(e) => setIncludeCarry(e.target.checked)} />
          Incluir saldo do mês anterior
        </label>
        <span>Saldo inicial (mês anterior): R$ {prevNet.toFixed(2)}</span>
      </div>

      {isLoading && <div>Carregando...</div>}
    </main>
  )
}
