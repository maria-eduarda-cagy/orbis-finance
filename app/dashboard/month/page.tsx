"use client"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchMonthData, computeMonthlyProjection } from "../../../lib/projection"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

function formatMonth(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export default function MonthlyDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
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

  const chartData = useMemo(() => {
    return [
      { name: "Receitas", valor: proj.totalIncome || 0 },
      { name: "Despesas Fixas", valor: proj.totalBills || 0 },
      { name: "Cartões", valor: proj.totalStatements || 0 }
    ]
  }, [proj])

  function addMonth(delta: number) {
    const d = new Date(selectedDate)
    d.setMonth(d.getMonth() + delta)
    setSelectedDate(d)
  }

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard Mensal</h1>
        <div className="flex gap-2">
          <Button onClick={() => addMonth(-1)}>Mês anterior</Button>
          <Button onClick={() => addMonth(1)}>Próximo mês</Button>
          <Button onClick={() => refetch()}>Atualizar</Button>
        </div>
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

      <Card className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#000000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="valor" stroke="#000" fillOpacity={1} fill="url(#colorVal)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {isLoading && <div>Carregando...</div>}

      <div className="flex gap-2">
        <Button onClick={() => location.href = "/dashboard/day"}>Ver Dashboard Diário</Button>
        <Button onClick={() => location.href = "/import"}>Importar Faturas CSV</Button>
        <Button onClick={() => location.href = "/settings"}>Configurações</Button>
      </div>
    </main>
  )
}
