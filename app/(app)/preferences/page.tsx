"use client"
import { useEffect, useMemo, useState } from "react"
import { AppHeader } from "../../../components/AppHeader"
import { Card } from "../../../components/ui/card"
import { ThemeToggle } from "../../../components/theme/ThemeToggle"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { getSupabase } from "../../../lib/supabaseClient"
import { BANK_OPTIONS } from "../../../utils/constants"
import { formatMonth } from "../../../utils/date"

export default function PreferencesPage() {
  const [mode, setMode] = useState<"import" | "total_only">("import")
  const [selectedMonth, setSelectedMonth] = useState(formatMonth(new Date()))
  const [cardName, setCardName] = useState("")
  const [customCardName, setCustomCardName] = useState("")
  const [amount, setAmount] = useState("")
  const bankOptions = BANK_OPTIONS

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data } = await supabase.from("user_card_mode").select("mode").single()
      if (data?.mode === "total_only" || data?.mode === "import") setMode(data.mode)
    }
    load()
  }, [])

  async function saveMode(m: "import" | "total_only") {
    setMode(m)
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    const user_id = auth.user?.id
    if (!user_id) return
    await supabase.from("user_card_mode").upsert({ user_id, mode: m, updated_at: new Date().toISOString() })
  }

  async function addManualTotal() {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    const user_id = auth.user?.id
    if (!user_id) return
    const name = cardName === "Outro" ? customCardName.trim() : cardName
    if (!name || !amount) return
    await supabase.from("monthly_card_totals").upsert({
      user_id,
      card_name: name,
      amount_total: Number(amount),
      statement_month: selectedMonth
    })
    setCardName("")
    setCustomCardName("")
    setAmount("")
  }

  return (
    <main className="p-4 space-y-6">
      <AppHeader title="Preferências" />

      <Card>
        <div className="text-lg font-semibold">Tema</div>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <div className="text-lg font-semibold">Fatura do cartão</div>
        <p className="text-sm text-muted-foreground mt-1">Como prefere considerar os gastos do cartão?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button className={mode === "import" ? "" : "bg-secondary text-secondary-foreground hover:brightness-110"} onClick={() => saveMode("import")}>Importar fatura (CSV)</Button>
          <Button className={mode === "total_only" ? "" : "bg-secondary text-secondary-foreground hover:brightness-110"} onClick={() => saveMode("total_only")}>Informar apenas o valor do cartão</Button>
        </div>

        {mode === "total_only" && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Mês da fatura</label>
                <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Cartão</label>
                <select
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  <option value="">Selecione</option>
                  {bankOptions.concat(["Outro"]).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {cardName === "Outro" && (
                  <Input className="mt-2" value={customCardName} onChange={(e) => setCustomCardName(e.target.value)} placeholder="Nome do cartão" />
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-muted-foreground">Valor total da fatura</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor" className="pl-8" />
                </div>
              </div>
            </div>
            <Button onClick={addManualTotal}>Salvar valor do cartão</Button>
            <p className="text-xs text-muted-foreground">O valor será considerado nas despesas mensais e diárias. Se também houver fatura importada, valerá a fatura importada para evitar contagem dupla.</p>
          </div>
        )}
      </Card>
    </main>
  )
}
