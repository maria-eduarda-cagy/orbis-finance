"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "../../../lib/supabaseClient"
import { Button } from "../../../components/ui/button"
import { Card } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { BillRule, IncomeRule, InvestmentSettings, VariableExpense, MonthlyIncome } from "../../../lib/types"
import { AppHeader } from "../../../components/AppHeader"
import { CurrencyText } from "../../../components/format/CurrencyText"
import { formatMonth, daysInMonth } from "../../../utils/date"

type NotificationSettings = {
  user_id: string
  telegram_chat_id: string | null
  enabled: boolean
  notify_days_before: number
}

export default function SettingsPage() {
  const router = useRouter()
  const [incomeRules, setIncomeRules] = useState<IncomeRule[]>([])
  const [billRules, setBillRules] = useState<BillRule[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [investment, setInvestment] = useState<InvestmentSettings | null>(null)

  const [incDesc, setIncDesc] = useState("")
  const [incAmount, setIncAmount] = useState("")
  const [incDay, setIncDay] = useState("")

  const [billDesc, setBillDesc] = useState("")
  const [billAmount, setBillAmount] = useState("")
  const [billDay, setBillDay] = useState("")
  const [billCategory, setBillCategory] = useState("")

  const [tgChatId, setTgChatId] = useState("")
  const [notifyDays, setNotifyDays] = useState("3")
  const [enabled, setEnabled] = useState(false)
  const [investmentPercentage, setInvestmentPercentage] = useState("10")

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => formatMonth(new Date()))

  const [monthlyIncomes, setMonthlyIncomes] = useState<MonthlyIncome[]>([])
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([])

  const [miDesc, setMiDesc] = useState("")
  const [miAmount, setMiAmount] = useState("")
  const [miDay, setMiDay] = useState("")
  const [miCategory, setMiCategory] = useState("")

  const [veDesc, setVeDesc] = useState("")
  const [veAmount, setVeAmount] = useState("")
  const [veDay, setVeDay] = useState("")
  const [veCategory, setVeCategory] = useState("")

  useEffect(() => {
    async function loadAll() {
      const supabase = getSupabase()
      const { data: incs } = await supabase.from("income_rules").select("*").order("day_of_month", { ascending: true })
      const { data: bills } = await supabase.from("bill_rules").select("*").order("day_of_month", { ascending: true })
      const { data: setting } = await supabase.from("user_notification_settings").select("*").single()
      const { data: invest } = await supabase.from("user_investment_settings").select("*").single()
      setIncomeRules((incs || []) as IncomeRule[])
      setBillRules((bills || []) as BillRule[])
      if (setting) {
        setSettings(setting as NotificationSettings)
        setTgChatId(String((setting as NotificationSettings).telegram_chat_id || ""))
        setNotifyDays(String((setting as NotificationSettings).notify_days_before ?? 3))
        setEnabled(Boolean((setting as NotificationSettings).enabled))
      }
      if (invest) {
        setInvestment(invest as InvestmentSettings)
        setInvestmentPercentage(String((invest as InvestmentSettings).monthly_percentage ?? 0))
      }
    }
    loadAll()
  }, [])

  const daysCount = (() => {
    const d = new Date(`${selectedMonth}-01`)
    return Number.isFinite(d.getTime()) ? daysInMonth(d) : 31
  })()
  const dayOptions = Array.from({ length: daysCount }, (_, i) => i + 1)

  useEffect(() => {
    async function loadMonthData() {
      const supabase = getSupabase()
      const { data: mi } = await supabase.from("monthly_incomes").select("*").eq("month", selectedMonth).order("day_of_month", { ascending: true })
      const { data: ve } = await supabase.from("variable_expenses").select("*").eq("month", selectedMonth).order("day_of_month", { ascending: true })
      setMonthlyIncomes((mi || []) as MonthlyIncome[])
      setVariableExpenses((ve || []) as VariableExpense[])
    }
    loadMonthData()
  }, [selectedMonth])

  async function getUserId() {
    const supabase = getSupabase()
    const { data } = await supabase.auth.getUser()
    return data.user?.id || null
  }

  async function addMonthlyIncome() {
    setMessage(null)
    const amount = Number(miAmount)
    const day = Number(miDay)
    if (!miDesc || isNaN(amount) || isNaN(day)) {
      setMessage("Preencha descrição, valor e dia.")
      return
    }
    setLoading(true)
    const supabase = getSupabase()
    const userId = await getUserId()
    if (!userId) {
      setLoading(false)
      setMessage("Usuário não autenticado.")
      return
    }
    const { data, error } = await supabase
      .from("monthly_incomes")
      .insert({ user_id: userId, description: miDesc, amount, day_of_month: day, month: selectedMonth, category: miCategory || null })
      .select()
      .single()
    if (error) {
      setLoading(false)
      setMessage("Falha ao salvar a receita do mês.")
      return
    }
    if (data) setMonthlyIncomes((prev) => [...prev, data as MonthlyIncome])
    setMiDesc("")
    setMiAmount("")
    setMiDay("")
    setMiCategory("")
    setLoading(false)
  }

  async function deleteMonthlyIncome(id: string) {
    const supabase = getSupabase()
    await supabase.from("monthly_incomes").delete().eq("id", id)
    setMonthlyIncomes((prev) => prev.filter((r) => r.id !== id))
  }

  async function addVariableExpense() {
    setMessage(null)
    const amount = Number(veAmount)
    const day = Number(veDay)
    if (!veDesc || isNaN(amount) || isNaN(day)) {
      setMessage("Preencha descrição, valor e dia.")
      return
    }
    setLoading(true)
    const supabase = getSupabase()
    const userId = await getUserId()
    if (!userId) {
      setLoading(false)
      setMessage("Usuário não autenticado.")
      return
    }
    const { data, error } = await supabase
      .from("variable_expenses")
      .insert({ user_id: userId, description: veDesc, amount, day_of_month: day, month: selectedMonth, category: veCategory || null })
      .select()
      .single()
    if (error) {
      setLoading(false)
      setMessage("Falha ao salvar a despesa variável.")
      return
    }
    if (data) setVariableExpenses((prev) => [...prev, data as VariableExpense])
    setVeDesc("")
    setVeAmount("")
    setVeDay("")
    setVeCategory("")
    setLoading(false)
  }

  async function deleteVariableExpense(id: string) {
    const supabase = getSupabase()
    await supabase.from("variable_expenses").delete().eq("id", id)
    setVariableExpenses((prev) => prev.filter((r) => r.id !== id))
  }

  async function addIncome() {
    setMessage(null)
    const amount = Number(incAmount)
    const day = Number(incDay)
    if (!incDesc || isNaN(amount) || isNaN(day)) {
      setMessage("Preencha descrição, valor e dia.")
      return
    }
    setLoading(true)
    const supabase = getSupabase()
    const { data } = await supabase
      .from("income_rules")
      .insert({ description: incDesc, amount, day_of_month: day, active: true })
      .select()
      .single()
    if (data) setIncomeRules((prev) => [...prev, data as IncomeRule])
    setIncDesc("")
    setIncAmount("")
    setIncDay("")
    setLoading(false)
  }

  async function addBill() {
    setMessage(null)
    const amount = Number(billAmount)
    const day = Number(billDay)
    if (!billDesc || isNaN(amount) || isNaN(day)) {
      setMessage("Preencha descrição, valor e dia.")
      return
    }
    setLoading(true)
    const supabase = getSupabase()
    const { data } = await supabase
      .from("bill_rules")
      .insert({ description: billDesc, amount, day_of_month: day, category: billCategory || null, active: true })
      .select()
      .single()
    if (data) setBillRules((prev) => [...prev, data as BillRule])
    setBillDesc("")
    setBillAmount("")
    setBillDay("")
    setBillCategory("")
    setLoading(false)
  }

  async function deleteIncome(id: string) {
    const supabase = getSupabase()
    await supabase.from("income_rules").delete().eq("id", id)
    setIncomeRules((prev) => prev.filter((r) => r.id !== id))
  }

  async function deleteBill(id: string) {
    const supabase = getSupabase()
    await supabase.from("bill_rules").delete().eq("id", id)
    setBillRules((prev) => prev.filter((r) => r.id !== id))
  }

  async function saveNotifications() {
    setMessage(null)
    setLoading(true)
    const supabase = getSupabase()
    if (settings?.user_id) {
      await supabase
        .from("user_notification_settings")
        .update({
          telegram_chat_id: tgChatId || null,
          notify_days_before: Number(notifyDays || 3),
          enabled
        })
        .eq("user_id", settings.user_id)
    } else {
      const { data } = await supabase
        .from("user_notification_settings")
        .insert({
          telegram_chat_id: tgChatId || null,
          notify_days_before: Number(notifyDays || 3),
          enabled
        })
        .select()
        .single()
      if (data) setSettings(data as NotificationSettings)
    }
    setLoading(false)
    setMessage("Configurações salvas.")
  }

  async function saveInvestment() {
    setMessage(null)
    const monthlyPercentage = Number(investmentPercentage || 0)
    if (isNaN(monthlyPercentage) || monthlyPercentage < 0) {
      setMessage("Informe uma porcentagem válida para investimento.")
      return
    }
    setLoading(true)
    const supabase = getSupabase()
    if (investment?.user_id) {
      await supabase
        .from("user_investment_settings")
        .update({ monthly_percentage: monthlyPercentage })
        .eq("user_id", investment.user_id)
    } else {
      const { data } = await supabase
        .from("user_investment_settings")
        .insert({ monthly_percentage: monthlyPercentage })
        .select()
        .single()
      if (data) setInvestment(data as InvestmentSettings)
    }
    setLoading(false)
    setMessage("Configurações salvas.")
  }

  return (
    <main className="relative min-h-screen">
      <div className="md:hidden p-4 space-y-6">
        <AppHeader title="Configurações" />
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Configurações</h2>
              <p className="text-sm text-muted-foreground">Ajuste regras, notificações e despesas.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Mês</label>
              <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
            
            {/* <Card>
              <div>
                <h3 className="text-base font-semibold">Notificações (Telegram)</h3>
                <p className="text-sm text-muted-foreground">Receba avisos antes do vencimento.</p>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Telegram chat_id</label>
                  <Input value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="ex: 123456789" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Dias antes</label>
                  <Input value={notifyDays} onChange={(e) => setNotifyDays(e.target.value)} placeholder="3" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                  <span className="text-sm">Ativar notificações</span>
                </div>
              </div>
              <Button className="mt-3" onClick={saveNotifications} disabled={loading}>
                {loading ? "Salvando..." : "Salvar notificações"}
              </Button>
            </Card> */}

            <Card>
              <div>
                <h3 className="text-base font-semibold">Investimento</h3>
                <p className="text-sm text-muted-foreground">Percentual das receitas reservado para investimentos.</p>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Percentual</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={investmentPercentage}
                    onChange={(e) => setInvestmentPercentage(e.target.value)}
                    placeholder="ex: 12.5"
                  />
                  <div className="mt-2 text-xs text-muted-foreground">Use qualquer porcentagem (ex.: 7.5%).</div>
                </div>
              </div>
              <Button className="mt-3" onClick={saveInvestment} disabled={loading}>
                {loading ? "Salvando..." : "Salvar investimento"}
              </Button>
            </Card>

            <Card>
              <div>
                <h3 className="text-base font-semibold">Receitas recorrentes</h3>
                <p className="text-sm text-muted-foreground">Organize entradas fixas do mês.</p>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input value={incDesc} onChange={(e) => setIncDesc(e.target.value)} placeholder="Descrição" />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$ </span>
                  <Input type="number" inputMode="decimal" step="0.01" min="0" value={incAmount} onChange={(e) => setIncAmount(e.target.value)} placeholder="Valor" className="pl-8" />
                </div>
                <Input type="number" min="1" max={daysCount} step="1" list="days-options" value={incDay} onChange={(e) => setIncDay(e.target.value)} placeholder="Dia do mês" />
              </div>
              <datalist id="days-options">
                {dayOptions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              <Button className="mt-3" onClick={addIncome} disabled={loading}>
                {loading ? "Salvando..." : "Adicionar receita"}
              </Button>
              <div className="mt-4 space-y-2">
                {incomeRules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>{r.description} — <CurrencyText value={r.amount} /> — dia {r.day_of_month}</div>
                    <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => deleteIncome(r.id)}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div>
                <h3 className="text-base font-semibold">Despesas fixas</h3>
                <p className="text-sm text-muted-foreground">Controle contas recorrentes e categorias.</p>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input value={billDesc} onChange={(e) => setBillDesc(e.target.value)} placeholder="Descrição" />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" inputMode="decimal" step="0.01" min="0" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder="Valor" className="pl-8" />
                </div>
                <Input type="number" min="1" max={daysCount} step="1" list="days-options" value={billDay} onChange={(e) => setBillDay(e.target.value)} placeholder="Dia do mês" />
                <Input value={billCategory} onChange={(e) => setBillCategory(e.target.value)} placeholder="Categoria (opcional)" />
              </div>
              <Button className="mt-3" onClick={addBill} disabled={loading}>
                {loading ? "Salvando..." : "Adicionar despesa"}
              </Button>
              <div className="mt-4 space-y-2">
                {billRules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>{r.description} — <CurrencyText value={r.amount} /> — dia {r.day_of_month}</div>
                    <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => deleteBill(r.id)}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div>
                <h3 className="text-base font-semibold">Receita mensal (pontual)</h3>
                <p className="text-sm text-muted-foreground">Entradas específicas deste mês.</p>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input value={miDesc} onChange={(e) => setMiDesc(e.target.value)} placeholder="Descrição" />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" inputMode="decimal" step="0.01" min="0" value={miAmount} onChange={(e) => setMiAmount(e.target.value)} placeholder="Valor" className="pl-8" />
                </div>
                <Input type="number" min="1" max={daysCount} step="1" list="days-options" value={miDay} onChange={(e) => setMiDay(e.target.value)} placeholder="Dia do mês" />
                <Input value={miCategory} onChange={(e) => setMiCategory(e.target.value)} placeholder="Categoria (opcional)" />
              </div>
              <Button className="mt-3" onClick={addMonthlyIncome} disabled={loading}>
                {loading ? "Salvando..." : "Adicionar receita do mês"}
              </Button>
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">Histórico do mês</div>
                <div className="space-y-2">
                  {monthlyIncomes.length === 0 && <div className="text-sm text-muted-foreground">Sem receitas pontuais neste mês.</div>}
                {monthlyIncomes.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>{r.description || "Receita"} — <CurrencyText value={r.amount} /> — dia {r.day_of_month}</div>
                    <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => deleteMonthlyIncome(r.id)}>
                      Remover
                    </Button>
                  </div>
                ))}
                </div>
              </div>
            </Card>

            <Card>
              <div>
                <h3 className="text-base font-semibold">Despesa variável</h3>
                <p className="text-sm text-muted-foreground">Despesas específicas deste mês.</p>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input value={veDesc} onChange={(e) => setVeDesc(e.target.value)} placeholder="Descrição" />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" inputMode="decimal" step="0.01" min="0" value={veAmount} onChange={(e) => setVeAmount(e.target.value)} placeholder="Valor" className="pl-8" />
                </div>
                <Input type="number" min="1" max={daysCount} step="1" list="days-options" value={veDay} onChange={(e) => setVeDay(e.target.value)} placeholder="Dia do mês" />
                <Input value={veCategory} onChange={(e) => setVeCategory(e.target.value)} placeholder="Categoria (opcional)" />
              </div>
              <Button className="mt-3" onClick={addVariableExpense} disabled={loading}>
                {loading ? "Salvando..." : "Adicionar despesa variável"}
              </Button>
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">Histórico do mês</div>
                <div className="space-y-2">
                  {variableExpenses.length === 0 && <div className="text-sm text-muted-foreground">Sem despesas variáveis neste mês.</div>}
                {variableExpenses.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>{r.description || "Despesa"} — <CurrencyText value={r.amount} /> — dia {r.day_of_month}</div>
                    <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => deleteVariableExpense(r.id)}>
                      Remover
                    </Button>
                  </div>
                ))}
                </div>
              </div>
            </Card>
          </div>

          {message && <div className="mt-4 text-success text-sm">{message}</div>}
        </Card>
      </div>

      <div className="hidden md:block">
        <div className="pointer-events-none opacity-30">
          <div className="p-4">
            <AppHeader title="Configurações" />
          </div>
        </div>
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => router.back()} />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Configurações</h2>
                <p className="text-sm text-muted-foreground">Ajuste regras, notificações e despesas.</p>
              </div>
              <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => router.back()}>
                Fechar
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Mês</label>
                <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
              <datalist id="days-options">
                {dayOptions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              {/* <Card>
                <div>
                  <h3 className="text-base font-semibold">Notificações (Telegram)</h3>
                  <p className="text-sm text-muted-foreground">Receba avisos antes do vencimento.</p>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Telegram chat_id</label>
                    <Input value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="ex: 123456789" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Dias antes</label>
                    <Input value={notifyDays} onChange={(e) => setNotifyDays(e.target.value)} placeholder="3" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                    <span className="text-sm">Ativar notificações</span>
                  </div>
                </div>
                <Button className="mt-3" onClick={saveNotifications} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar notificações"}
                </Button>
              </Card> */}

              <Card>
                <div>
                  <h3 className="text-base font-semibold">Investimento</h3>
                  <p className="text-sm text-muted-foreground">Percentual das receitas reservado para investimentos.</p>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Percentual</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={investmentPercentage}
                      onChange={(e) => setInvestmentPercentage(e.target.value)}
                      placeholder="ex: 12.5"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Use qualquer porcentagem (ex.: 7.5%).</div>
                  </div>
                </div>
                <Button className="mt-3" onClick={saveInvestment} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar investimento"}
                </Button>
              </Card>

              <Card>
                <div>
                  <h3 className="text-base font-semibold">Receitas recorrentes</h3>
                  <p className="text-sm text-muted-foreground">Organize entradas fixas do mês.</p>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input value={incDesc} onChange={(e) => setIncDesc(e.target.value)} placeholder="Descrição" />
                  <Input value={incAmount} onChange={(e) => setIncAmount(e.target.value)} placeholder="Valor" />
                  <Input value={incDay} onChange={(e) => setIncDay(e.target.value)} placeholder="Dia do mês" />
                </div>
                <Button className="mt-3" onClick={addIncome} disabled={loading}>
                  {loading ? "Salvando..." : "Adicionar receita"}
                </Button>
                <div className="mt-4 space-y-2">
                  {incomeRules.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <div>{r.description} — <CurrencyText value={r.amount} /> — dia {r.day_of_month}</div>
                      <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => deleteIncome(r.id)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div>
                  <h3 className="text-base font-semibold">Despesas fixas</h3>
                  <p className="text-sm text-muted-foreground">Controle contas recorrentes e categorias.</p>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Input value={billDesc} onChange={(e) => setBillDesc(e.target.value)} placeholder="Descrição" />
                  <Input value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder="Valor" />
                  <Input value={billDay} onChange={(e) => setBillDay(e.target.value)} placeholder="Dia do mês" />
                  <Input value={billCategory} onChange={(e) => setBillCategory(e.target.value)} placeholder="Categoria (opcional)" />
                </div>
                <Button className="mt-3" onClick={addBill} disabled={loading}>
                  {loading ? "Salvando..." : "Adicionar despesa"}
                </Button>
                <div className="mt-4 space-y-2">
                  {billRules.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <div>{r.description} — <CurrencyText value={r.amount} /> — dia {r.day_of_month}</div>
                      <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => deleteBill(r.id)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div>
                  <h3 className="text-base font-semibold">Receita mensal (pontual)</h3>
                  <p className="text-sm text-muted-foreground">Entradas específicas deste mês.</p>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Input value={miDesc} onChange={(e) => setMiDesc(e.target.value)} placeholder="Descrição" />
                  <Input value={miAmount} onChange={(e) => setMiAmount(e.target.value)} placeholder="Valor" />
                  <Input value={miDay} onChange={(e) => setMiDay(e.target.value)} placeholder="Dia do mês" />
                  <Input value={miCategory} onChange={(e) => setMiCategory(e.target.value)} placeholder="Categoria (opcional)" />
                </div>
                <Button className="mt-3" onClick={addMonthlyIncome} disabled={loading}>
                  {loading ? "Salvando..." : "Adicionar receita do mês"}
                </Button>
                <div className="mt-4 space-y-2">
                  {monthlyIncomes.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <div>{r.description || "Receita"} — <CurrencyText value={r.amount} /> — dia {r.day_of_month}</div>
                      <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => deleteMonthlyIncome(r.id)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div>
                  <h3 className="text-base font-semibold">Despesa variável</h3>
                  <p className="text-sm text-muted-foreground">Despesas específicas deste mês.</p>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Input value={veDesc} onChange={(e) => setVeDesc(e.target.value)} placeholder="Descrição" />
                  <Input value={veAmount} onChange={(e) => setVeAmount(e.target.value)} placeholder="Valor" />
                  <Input value={veDay} onChange={(e) => setVeDay(e.target.value)} placeholder="Dia do mês" />
                  <Input value={veCategory} onChange={(e) => setVeCategory(e.target.value)} placeholder="Categoria (opcional)" />
                </div>
                <Button className="mt-3" onClick={addVariableExpense} disabled={loading}>
                  {loading ? "Salvando..." : "Adicionar despesa variável"}
                </Button>
                <div className="mt-4 space-y-2">
                  {variableExpenses.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <div>{r.description || "Despesa"} — <CurrencyText value={r.amount} /> — dia {r.day_of_month}</div>
                      <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => deleteVariableExpense(r.id)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {message && <div className="mt-4 text-success text-sm">{message}</div>}
          </Card>
        </div>
      </div>
    </main>
  )
}
