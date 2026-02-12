"use client"
import { useEffect, useState } from "react"
import { getSupabase } from "../../lib/supabaseClient"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { BillRule, IncomeRule } from "../../lib/types"

type NotificationSettings = {
  user_id: string
  telegram_chat_id: string | null
  enabled: boolean
  notify_days_before: number
}

export default function SettingsPage() {
  const [incomeRules, setIncomeRules] = useState<IncomeRule[]>([])
  const [billRules, setBillRules] = useState<BillRule[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)

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

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadAll() {
      const supabase = getSupabase()
      const { data: incs } = await supabase.from("income_rules").select("*").order("day_of_month", { ascending: true })
      const { data: bills } = await supabase.from("bill_rules").select("*").order("day_of_month", { ascending: true })
      const { data: setting } = await supabase.from("user_notification_settings").select("*").single()
      setIncomeRules((incs || []) as IncomeRule[])
      setBillRules((bills || []) as BillRule[])
      if (setting) {
        setSettings(setting as NotificationSettings)
        setTgChatId(String((setting as NotificationSettings).telegram_chat_id || ""))
        setNotifyDays(String((setting as NotificationSettings).notify_days_before ?? 3))
        setEnabled(Boolean((setting as NotificationSettings).enabled))
      }
    }
    loadAll()
  }, [])

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

  return (
    <main className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Configurações</h1>

      <Card>
        <h2 className="text-lg font-semibold">Notificações (Telegram)</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Telegram chat_id</label>
            <Input value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="ex: 123456789" />
          </div>
          <div>
            <label className="text-sm">Dias antes</label>
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
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Receitas recorrentes</h2>
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
              <div>{r.description} — R$ {r.amount.toFixed(2)} — dia {r.day_of_month}</div>
              <Button onClick={() => deleteIncome(r.id)}>Remover</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Despesas fixas</h2>
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
              <div>{r.description} — R$ {r.amount.toFixed(2)} — dia {r.day_of_month}</div>
              <Button onClick={() => deleteBill(r.id)}>Remover</Button>
            </div>
          ))}
        </div>
      </Card>

      {message && <div className="text-green-700 text-sm">{message}</div>}
    </main>
  )
}
