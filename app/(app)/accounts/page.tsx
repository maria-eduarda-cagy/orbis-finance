"use client"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AppHeader } from "../../../components/AppHeader"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { getSupabase } from "../../../lib/supabaseClient"
import { formatMonth, formatMonthLabel, nextMonthStr, formatMonthTitle } from "../../../utils/date"
import { BANK_OPTIONS, CATEGORY_OPTIONS } from "../../../utils/constants"
import { CurrencyText } from "../../../components/format/CurrencyText"
import { LoaderInline, LoadingCard, UpdatingOverlay } from "../../../components/ui/loader"

type BankTransfer = {
  id: string
  description: string | null
  amount: number
  transfer_date: string
  transfer_month: string
  direction: "entrada" | "saida"
  bank_name: string | null
  category: string | null
}

type BankStatementImport = {
  id: string
  bank: string
  statement_month: string
  file_name: string | null
  created_at: string
}

type ParsedStatementRow = {
  transfer_date: string
  amount: number
  description: string
}


export default function AccountsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [direction, setDirection] = useState<"entrada" | "saida">("saida")
  const [bankName, setBankName] = useState("")
  const [customBankName, setCustomBankName] = useState("")
  const [statementBank, setStatementBank] = useState("")
  const [customStatementBank, setCustomStatementBank] = useState("")
  const [statementFile, setStatementFile] = useState<File | null>(null)
  const [statementMessage, setStatementMessage] = useState<string | null>(null)
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate])
  const [transferDate, setTransferDate] = useState(`${month}-01`)

  const bankOptions = BANK_OPTIONS
  const categoryOptions = CATEGORY_OPTIONS

  const { data, refetch, isLoading, isFetching } = useQuery({
    queryKey: ["bank-transfers", month],
    queryFn: async () => {
      const supabase = getSupabase()
      const monthStart = `${month}-01`
      const monthEnd = `${nextMonthStr(month)}-01`
      const { data } = await supabase
        .from("bank_transfers")
        .select("*")
        .gte("transfer_date", monthStart)
        .lt("transfer_date", monthEnd)
        .order("transfer_date", { ascending: true })
      return (data || []) as BankTransfer[]
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always"
  })

  const transfers = useMemo(() => (data || []) as BankTransfer[], [data])
  const monthTransfers = useMemo(() => transfers, [transfers])

  const { data: statementImports, refetch: refetchImports } = useQuery({
    queryKey: ["bank-statement-imports", month],
    queryFn: async () => {
      const supabase = getSupabase()
      const monthLabel = formatMonthLabel(month)
      const { data } = await supabase
        .from("bank_statement_imports")
        .select("*")
        .or(`statement_month.eq.${month},statement_month.eq.${monthLabel}`)
        .order("created_at", { ascending: false })
      return (data || []) as BankStatementImport[]
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always"
  })

  function addMonth(delta: number) {
    const d = new Date(selectedDate)
    d.setMonth(d.getMonth() + delta)
    setSelectedDate(d)
    const nextMonth = formatMonth(d)
    setTransferDate(`${nextMonth}-01`)
  }

  function parseBrazilianNumber(value: string) {
    return Number(value.replace(/\./g, "").replace(",", ".").trim())
  }

  function parseStatementFile(text: string): ParsedStatementRow[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const headerIndex = lines.findIndex((l) => l.startsWith("RELEASE_DATE;"))
    if (headerIndex === -1) return []
    const dataLines = lines.slice(headerIndex + 1)
    const rows: ParsedStatementRow[] = []
    for (const line of dataLines) {
      const parts = line.split(";")
      if (parts.length < 5) continue
      const releaseDate = parts[0].trim()
      const transactionType = parts[1].trim()
      const amountRaw = parts[3].trim()
      if (!releaseDate || !transactionType || !amountRaw) continue
      const [d, m, y] = releaseDate.split("-").map((v) => Number(v))
      if (!d || !m || !y) continue
      const isoDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const amount = parseBrazilianNumber(amountRaw)
      if (!Number.isFinite(amount) || amount === 0) continue
      rows.push({ transfer_date: isoDate, amount, description: transactionType })
    }
    return rows
  }

  async function getUserId() {
    const supabase = getSupabase()
    const { data } = await supabase.auth.getUser()
    return data.user?.id || null
  }

  async function addTransfer() {
    const resolvedBank = bankName === "Outro" ? customBankName.trim() : bankName
    const parsedAmount = Number(String(amount).replace(",", "."))
    if (!resolvedBank || !transferDate || Number.isNaN(parsedAmount) || parsedAmount <= 0) return
    const supabase = getSupabase()
    const userId = await getUserId()
    if (!userId) return
    const { error } = await supabase.from("bank_transfers").insert({
      user_id: userId,
      description: description.trim() || null,
      amount: parsedAmount,
      transfer_date: transferDate,
      transfer_month: month,
      direction,
      bank_name: resolvedBank,
      category: null
    })
    if (error) {
      setStatementMessage("Falha ao salvar a transferência.")
      return
    }
    setDescription("")
    setAmount("")
    setBankName("")
    setCustomBankName("")
    refetch()
  }

  async function importStatement() {
    const resolvedBank = statementBank === "Outro" ? customStatementBank.trim() : statementBank
    if (!statementFile || !resolvedBank) return
    setStatementMessage(null)
    const supabase = getSupabase()
    const userId = await getUserId()
    if (!userId) return
    const text = await statementFile.text()
    const rows = parseStatementFile(text)
    if (rows.length === 0) {
      setStatementMessage("Não foi possível ler o extrato.")
      return
    }
    const fileMonth = rows[0].transfer_date.slice(0, 7)
    const { data: importRow, error: importError } = await supabase
      .from("bank_statement_imports")
      .insert({
        user_id: userId,
        bank: resolvedBank,
        statement_month: fileMonth,
        file_name: statementFile.name
      })
      .select("id")
      .single()
    if (importError) {
      setStatementMessage("Falha ao registrar o import.")
      return
    }
    const importId = importRow?.id || null
    const transfers = rows.map((row) => ({
      user_id: userId,
      bank_name: resolvedBank,
      description: row.description,
      amount: Math.abs(row.amount),
      transfer_date: row.transfer_date,
      transfer_month: row.transfer_date.slice(0, 7),
      direction: row.amount >= 0 ? "entrada" : "saida",
      import_batch_id: importId,
      category: null
    }))
    const { error: transferError } = await supabase.from("bank_transfers").insert(transfers)
    if (transferError) {
      setStatementMessage(`Falha ao importar transferências: ${transferError.message}`)
      return
    }
    setStatementFile(null)
    setStatementBank("")
    setCustomStatementBank("")
    refetchImports()
    refetch()
    const { count } = await supabase
      .from("bank_transfers")
      .select("id", { count: "exact", head: true })
      .eq("import_batch_id", importId || "")
    setStatementMessage(`Extrato importado: ${transfers.length} linhas. Salvas: ${count ?? 0}.`)
    if (fileMonth) {
      const [y, m] = fileMonth.split("-").map((v) => Number(v))
      if (y && m) {
        const nextDate = new Date(y, m - 1, 1)
        setSelectedDate(nextDate)
        setTransferDate(`${fileMonth}-01`)
      }
    }
    setStatementMessage(`Extrato importado para ${fileMonth}.`)
  }

  async function removeStatementImport(id: string) {
    const supabase = getSupabase()
    await supabase.from("bank_transfers").delete().eq("import_batch_id", id)
    await supabase.from("bank_statement_imports").delete().eq("id", id)
    refetchImports()
    refetch()
  }

  async function saveTransferCategory(id: string) {
    const value = editingCategory.trim()
    if (!value) {
      setEditingTransferId(null)
      return
    }
    setSavingCategory(true)
    const supabase = getSupabase()
    await supabase.from("bank_transfers").update({ category: value }).eq("id", id)
    setSavingCategory(false)
    setEditingTransferId(null)
    setEditingCategory("")
    refetch()
  }

  return (
    <main className="p-4 space-y-6">
      <AppHeader title={`Conta Bancária — ${formatMonthTitle(month)}`} />
      {(isLoading || isFetching) && <UpdatingOverlay label="Atualizando dados..." />}
      <div className="flex flex-wrap gap-2">
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(-1)}>
          Mês anterior
        </Button>
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(1)}>
          Próximo mês
        </Button>
        
      </div>

      <Card>
        <div className="text-lg font-semibold">Transferências bancárias</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="">Banco</option>
            {bankOptions.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
          {bankName === "Outro" && (
            <input
              value={customBankName}
              onChange={(e) => setCustomBankName(e.target.value)}
              placeholder="Nome do banco"
              className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            />
          )}
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor"
              className="w-full rounded-lg bg-background-subtle text-foreground pl-8 pr-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>
          <input
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "entrada" | "saida")}
            className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
        <div className="mt-3">
          <Button onClick={addTransfer}>Adicionar transferência</Button>
        </div>
      </Card>

      <Card>
        <div className="text-lg font-semibold">Importar extrato bancário</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <select
            value={statementBank}
            onChange={(e) => setStatementBank(e.target.value)}
            className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="">Banco</option>
            {bankOptions.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
          {statementBank === "Outro" && (
            <input
              value={customStatementBank}
              onChange={(e) => setCustomStatementBank(e.target.value)}
              placeholder="Nome do banco"
              className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className={`inline-flex items-center gap-2 rounded-full bg-background-elevated px-0 py-2 text-sm font-semibold transition-colors ${statementBank ? "cursor-pointer hover:bg-background-subtle" : "cursor-not-allowed opacity-60"}`}>
              Escolher arquivo
              <input
                type="file"
                accept=".csv,.ofx"
                onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
                className="hidden"
                disabled={!statementBank || (statementBank === "Outro" && !customStatementBank.trim())}
              />
            </label>
            <span className="text-xs text-muted-foreground">
              {statementFile ? statementFile.name : "Nenhum arquivo selecionado"}
            </span>
          </div>
          <Button
            disabled={!statementFile || !statementBank || (statementBank === "Outro" && !customStatementBank.trim())}
            onClick={importStatement}
          >
            Importar extrato
          </Button>
        </div>
        {statementMessage && <div className="mt-2 text-xs text-danger">{statementMessage}</div>}
        {statementFile && (
          <div className="mt-2 text-xs text-muted-foreground">
            Arquivo selecionado: {statementFile.name}
          </div>
        )}

        <div className="mt-5">
          <div className="text-sm font-semibold">Extratos importados</div>
          <div className="mt-2 space-y-2 text-sm">
            {(statementImports || []).length === 0 && <div className="text-muted-foreground">Nenhum extrato importado.</div>}
            {(statementImports || []).map((imp) => (
              <div key={imp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background-elevated p-3 shadow-[0_5px_12px_rgba(6,10,18,0.14)]">
                <div>
                  <div className="font-medium text-foreground">{imp.bank} • {imp.statement_month}</div>
                  <div className="text-xs text-muted-foreground">{imp.file_name || "Arquivo"}</div>
                </div>
                <Button
                  className="bg-secondary text-secondary-foreground hover:brightness-110"
                  onClick={() => removeStatementImport(imp.id)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-lg font-semibold">Histórico do mês</div>
        {isLoading && <div className="mt-3 text-sm text-muted-foreground">Carregando...</div>}
        <div className="mt-3 space-y-2 text-sm">
          {monthTransfers.length === 0 && !isLoading && <div className="text-muted-foreground">Sem transferências.</div>}
          {monthTransfers.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background-elevated p-3 shadow-[0_5px_12px_rgba(6,10,18,0.14)]">
              <div>
                <div className="font-medium text-foreground">{item.description || "Transferência"}</div>
                {item.bank_name && <div className="text-xs text-muted-foreground">{item.bank_name}</div>}
                <div className="text-xs text-muted-foreground">{item.transfer_date}</div>
                {editingTransferId === item.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={editingCategory}
                      onChange={(e) => setEditingCategory(e.target.value)}
                      className="rounded-full bg-background-subtle text-foreground px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    >
                      {categoryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <Button
                      className="bg-secondary text-secondary-foreground hover:brightness-110"
                      onClick={() => saveTransferCategory(item.id)}
                      disabled={savingCategory}
                    >
                      {savingCategory ? "Salvando..." : "Salvar"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTransferId(null)
                        setEditingCategory("")
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-background-subtle px-2 py-1 text-muted-foreground">
                      {item.category || "Sem categoria"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTransferId(item.id)
                        setEditingCategory(item.category || "Sem categoria")
                      }}
                      className="text-xs font-semibold text-primary hover:text-foreground transition-colors"
                    >
                      Editar categoria
                    </button>
                  </div>
                )}
              </div>
              <div className={`font-semibold ${item.direction === "entrada" ? "text-success" : "text-danger"}`}>
                <CurrencyText value={Number(item.amount)} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  )
}
