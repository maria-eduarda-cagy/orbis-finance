"use client"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchMonthData } from "../../../lib/projection"
import { itemsForDay, projectDailyBalances } from "../../../lib/daily"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { IncomeRule, BillRule, CardStatement } from "../../../lib/types"
import { AppHeader } from "../../../components/AppHeader"

function formatMonth(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function daysInMonth(date: Date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  return new Date(y, m + 1, 0).getDate()
}

export default function DailyDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [includeCarry, setIncludeCarry] = useState(true)
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate])
  const { data, isLoading } = useQuery({
    queryKey: ["month", month],
    queryFn: () => fetchMonthData(month)
  })

  const startBalance = useMemo(() => {
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const prevStatements = data?.prevStatements || []
    const prevTransactions = (data?.prevTransactions || []).reduce((s: number, r: { amount_brl: number }) => s + Number(r.amount_brl || 0), 0)
    const totalIncome = incomes.reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    const totalBills = bills.reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    const totalStatements = prevStatements.reduce((s: number, r: { amount_total: number }) => s + r.amount_total, 0) + prevTransactions
    return totalIncome - totalBills - totalStatements
  }, [data])

  const balances = useMemo<{ date: Date; balance: number; allowance: number }[]>(() => {
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const statements = data?.statements || []
    const initial = includeCarry ? startBalance : 0
    return projectDailyBalances(selectedDate, incomes, bills, statements, initial)
  }, [data, selectedDate, startBalance, includeCarry])

  function addMonth(delta: number) {
    const d = new Date(selectedDate)
    d.setMonth(d.getMonth() + delta)
    setSelectedDate(d)
  }

  const totalDays = daysInMonth(selectedDate)
  const days = Array.from({ length: totalDays }, (_, i) => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1))

  return (
    <main className="p-4 space-y-4">
      <AppHeader title={`Dashboard Diário — ${month}`} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => addMonth(-1)}>Mês anterior</Button>
        <Button onClick={() => addMonth(1)}>Próximo mês</Button>
      </div>

      {isLoading && <div>Carregando...</div>}
      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeCarry} onChange={(e) => setIncludeCarry(e.target.checked)} />
          Incluir saldo do mês anterior
        </label>
        <span>Saldo inicial (mês anterior): R$ {startBalance.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {days.map((d) => {
          const items = itemsForDay(d, data?.incomes || [], data?.bills || [], data?.statements || [])
          const bal = balances.find((b: { date: Date; balance: number; allowance: number }) => b.date.toDateString() === d.toDateString())
          return (
            <Card key={d.toISOString()}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{d.toLocaleDateString("pt-BR")}</div>
                <div className={`${(bal?.balance || 0) < 0 ? "text-red-600" : "text-green-700"} font-semibold`}>
                  R$ {(bal?.balance || 0).toFixed(2)}
                </div>
              </div>
              <div className="mt-2 text-sm">
                <div>Receitas: R$ {items.incs.reduce((s: number, r: IncomeRule) => s + r.amount, 0).toFixed(2)}</div>
                <div>Despesas: R$ {items.bls.reduce((s: number, r: BillRule) => s + r.amount, 0).toFixed(2)}</div>
                <div>Cartões: R$ {items.sts.reduce((s: number, r: CardStatement) => s + r.amount_total, 0).toFixed(2)}</div>
                <div className="mt-2">Allowance diário: R$ {(bal?.allowance || 0).toFixed(2)}</div>
              </div>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
