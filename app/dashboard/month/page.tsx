"use client"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchMonthData, computeMonthlyProjection } from "../../../lib/projection"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
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
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate])

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["month", month],
    queryFn: () => fetchMonthData(month)
  })

  const proj = useMemo(() => {
    const incomes = data?.incomes || []
    const bills = data?.bills || []
    const statements = data?.statements || []
    return computeMonthlyProjection(incomes, bills, statements)
  }, [data])

  const transactions = useMemo(() => {
    const list = (data?.transactions || []) as CardTransaction[]
    return hideNegative ? list.filter((t) => Number(t.amount_brl) >= 0) : list
  }, [data, hideNegative])

  const totalsByCard = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      const name = t.cards?.name || "Cartão"
      map.set(name, (map.get(name) || 0) + Number(t.amount_brl || 0))
    }
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }))
  }, [transactions])

  const totalsByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      const name = t.category || "Sem categoria"
      map.set(name, (map.get(name) || 0) + Number(t.amount_brl || 0))
    }
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }))
  }, [transactions])

  const visibleTransactions = useMemo(() => {
    if (showAll) return transactions
    return transactions.slice(0, 20)
  }, [transactions, showAll])

  function addMonth(delta: number) {
    const d = new Date(selectedDate)
    d.setMonth(d.getMonth() + delta)
    setSelectedDate(d)
  }

  return (
    <main className="p-4 space-y-4">
      <AppHeader title={`Dashboard Mensal — ${month}`} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => addMonth(-1)}>Mês anterior</Button>
        <Button onClick={() => addMonth(1)}>Próximo mês</Button>
        <Button onClick={() => refetch()}>Atualizar</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <div className="text-sm text-neutral-500">Receitas</div>
          <div className="text-2xl font-bold">R$ {proj.totalIncome?.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-sm text-neutral-500">Despesas Fixas</div>
          <div className="text-2xl font-bold">R$ {proj.totalBills?.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-sm text-neutral-500">Cartões</div>
          <div className="text-2xl font-bold">R$ {proj.totalStatements?.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-sm text-neutral-500">Saldo Projetado</div>
          <div className={`text-2xl font-bold ${proj.net < 0 ? "text-red-600" : "text-green-700"}`}>
            R$ {proj.net?.toFixed(2)}
          </div>
        </Card>
      </div>

      <Card className="h-72">
        <div className="text-sm text-neutral-100 px-4 pt-3">Gastos por categoria</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={totalsByCategory}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#6E72FC" stroke="#4F52CC" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {isLoading && <div>Carregando...</div>}

      <Card>
        <h2 className="text-lg font-semibold text-neutral-100">Gastos do Cartão (itens)</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hideNegative} onChange={(e) => setHideNegative(e.target.checked)} />
            Ocultar valores negativos (pagamentos)
          </label>
          {transactions.length > 20 && (
            <Button onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Mostrar menos" : "Mostrar todos"}
            </Button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Card>
            <div className="font-medium text-neutral-100">Total por cartão</div>
            <div className="mt-2 space-y-1">
              {totalsByCard.length === 0 && <div className="text-neutral-600">Sem dados.</div>}
              {totalsByCard.map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span>{t.name}</span>
                  <span className="font-semibold">R$ {t.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="font-medium text-neutral-100">Total por categoria</div>
            <div className="mt-2 space-y-1">
              {totalsByCategory.length === 0 && <div className="text-neutral-600">Sem dados.</div>}
              {totalsByCategory.map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span>{t.name}</span>
                  <span className="font-semibold">R$ {t.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {transactions.length === 0 && <div className="text-neutral-600">Sem lançamentos.</div>}
          {visibleTransactions.map((t: CardTransaction) => (
            <div key={t.id} className="flex flex-col gap-1 border-b pb-2 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  {t.cards?.name || "Cartão"} • {t.purchase_date}
                </div>
                <div className={`${t.amount_brl < 0 ? "text-green-700" : "text-red-600"} font-semibold`}>
                  R$ {Number(t.amount_brl).toFixed(2)}
                </div>
              </div>
              <div className="text-neutral-700">{t.description || "-"}</div>
              <div className="text-neutral-500">
                {t.category || "-"} {t.installment ? `• ${t.installment}` : ""}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  )
}
