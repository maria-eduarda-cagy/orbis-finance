"use client"
import { useMemo, useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { fetchMonthData } from "../../../lib/projection"
import { itemsForDay, projectDailyBalances } from "../../../lib/daily"
import { buildVariableExpenseMap } from "../../../lib/variableExpenses"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { IncomeRule, BillRule, CardStatement, VariableExpense } from "../../../lib/types"
import { AppHeader } from "../../../components/AppHeader"
import { formatMonth, daysInMonth, formatMonthTitle } from "../../../utils/date"
import { CurrencyText } from "../../../components/format/CurrencyText"
import { LoaderInline, LoadingCard, UpdatingOverlay } from "../../../components/ui/loader"

export default function DailyDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [includeCarry, setIncludeCarry] = useState(true)
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate])
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["month", month],
    queryFn: () => fetchMonthData(month),
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always"
  })

  const startBalance = useMemo(() => {
    const createdAt = data?.userCreatedAt ? new Date(data.userCreatedAt) : null
    const createdMonth = createdAt ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}` : null
    if (createdMonth && month <= createdMonth) return 0
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const prevStatements = data?.prevStatements || []
    const prevTransactions = (data?.prevTransactions || []).reduce((s: number, r: { amount_brl: number }) => s + Number(r.amount_brl || 0), 0)
    const prevTransfers = (data?.prevTransfers || []).reduce(
      (s: number, r: { amount: number; direction: "entrada" | "saida" }) =>
        s + (r.direction === "entrada" ? Number(r.amount || 0) : -Number(r.amount || 0)),
      0
    )
    const totalIncome = incomes.reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    const totalBills = bills.reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    const totalStatements = prevStatements.reduce((s: number, r: { amount_total: number }) => s + r.amount_total, 0) + prevTransactions
    return totalIncome - totalBills - totalStatements + prevTransfers
  }, [data, month])

  const investmentPercentage = useMemo(() => Number((data as { investmentPercentage?: number })?.investmentPercentage || 0), [data])
  const investmentMonthly = useMemo(() => {
    const totalIncome = (data?.incomes || []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    return (totalIncome * investmentPercentage) / 100
  }, [data, investmentPercentage])

  const variableExpenseMap = useMemo(() => {
    const list = ((data as { variableExpenses?: VariableExpense[] })?.variableExpenses || []) as VariableExpense[]
    return buildVariableExpenseMap(list, month)
  }, [data, month])

  const monthlyIncomeMap = useMemo(() => {
    const list = ((data as { monthlyIncomes?: Array<{ day_of_month: number; amount: number }> })?.monthlyIncomes || []) as Array<{
      day_of_month: number
      amount: number
    }>
    const map = new Map<number, number>()
    for (const r of list) {
      const d = Number(r.day_of_month || 0)
      map.set(d, (map.get(d) || 0) + Number(r.amount || 0))
    }
    return map
  }, [data])

  const balances = useMemo<{ date: Date; balance: number; allowance: number }[]>(() => {
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const statements = data?.statements || []
    const transfers = (data as { transfers?: { amount: number; direction: "entrada" | "saida"; transfer_date: string; transfer_month: string }[] })?.transfers || []
    const initial = (includeCarry ? startBalance : 0) - investmentMonthly
    return projectDailyBalances(selectedDate, incomes, bills, statements, transfers, monthlyIncomeMap, variableExpenseMap, initial)
  }, [data, selectedDate, startBalance, includeCarry, investmentMonthly, variableExpenseMap, monthlyIncomeMap])

  function addMonth(delta: number) {
    const d = new Date(selectedDate)
    d.setMonth(d.getMonth() + delta)
    setSelectedDate(d)
  }

  const totalDays = daysInMonth(selectedDate)
  const days = Array.from({ length: totalDays }, (_, i) => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1))
  const today = new Date()
  const isSameMonthAsToday =
    selectedDate.getFullYear() === today.getFullYear() && selectedDate.getMonth() === today.getMonth()
  const todayDateKey = today.toDateString()
  const orderedDays = isSameMonthAsToday
    ? [
        ...days.filter((d) => d.toDateString() === todayDateKey),
        ...days.filter((d) => d.toDateString() !== todayDateKey)
      ]
    : days

  return (
    <main className="p-4 space-y-6">
      <AppHeader title={`Dashboard Diário — ${formatMonthTitle(month)}`} />
      {(isLoading || isFetching) && <UpdatingOverlay label="Atualizando dados..." />}
      <div className="flex flex-wrap gap-2">
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(-1)}>
          Mês anterior
        </Button>
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(1)}>
          Próximo mês
        </Button>
      </div>

      
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <label className="flex items-center gap-2 rounded-full bg-background-elevated px-3 py-2 shadow-[0_3px_8px_rgba(6,10,18,0.1)]">
          <input type="checkbox" checked={includeCarry} onChange={(e) => setIncludeCarry(e.target.checked)} />
          Incluir saldo do mês anterior
        </label>
        <span>Saldo inicial (mês anterior): <CurrencyText value={startBalance} /></span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {orderedDays.map((d) => {
          const isToday = d.toDateString() === todayDateKey && isSameMonthAsToday
          const items = itemsForDay(d, data?.incomes || [], data?.bills || [], data?.statements || [], (data as { transfers?: any[] })?.transfers || [], monthlyIncomeMap, variableExpenseMap)
          const bal = balances.find((b: { date: Date; balance: number; allowance: number }) => b.date.toDateString() === d.toDateString())
          return (
          <Card
            key={d.toISOString()}
            className={`p-3 ${isToday ? "ring-2 ring-primary/60 bg-background-elevated/90 sm:col-span-2 lg:col-span-3 w-full" : ""}`}
          >
              <div className="flex items-center justify-between">
                <div className={`font-medium ${isToday ? "text-primary" : ""}`}>
                  {d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                </div>
              <div className={`${(bal?.balance || 0) < 0 ? "text-danger" : "text-success"} font-semibold`}>
                <CurrencyText value={bal?.balance || 0} />
              </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
              <div>Receitas: <CurrencyText value={items.incs.reduce((s: number, r: IncomeRule) => s + r.amount, 0) + (monthlyIncomeMap.get(d.getDate()) || 0)} /></div>
              <div>Despesas: <CurrencyText value={items.bls.reduce((s: number, r: BillRule) => s + r.amount, 0)} /></div>
              <div>Cartões: <CurrencyText value={items.sts.reduce((s: number, r: CardStatement) => s + r.amount_total, 0)} /></div>
              <div>Transferências: <CurrencyText value={items.tfs.reduce((s: number, r: { amount: number; direction: "entrada" | "saida" }) => s + (r.direction === "entrada" ? r.amount : -r.amount), 0)} /></div>
              <div className="pt-2 text-foreground font-medium">Allowance diário: <CurrencyText value={bal?.allowance || 0} /></div>
              </div>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
