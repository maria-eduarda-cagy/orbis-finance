"use client"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AppHeader } from "../../../components/AppHeader"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { getSupabase } from "../../../lib/supabaseClient"

type BankTransfer = {
  id: string
  description: string | null
  amount: number
  transfer_date: string
  transfer_month: string
  direction: "entrada" | "saida"
  bank_name: string | null
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

function formatMonth(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${m}.${y}`
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
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate])
  const [transferDate, setTransferDate] = useState(`${month}-01`)

  const bankOptions = [
    "Banco do Brasil",
    "Caixa",
    "Bradesco",
    "Itaú",
    "Santander",
    "Banrisul",
    "Sicoob",
    "Sicredi",
    "Nubank",
    "Inter",
    "C6 Bank",
    "Banco Pan",
    "Neon",
    "PicPay",
    "Next",
    "BTG Pactual",
    "XP",
    "Outro"
  ]

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["bank-transfers", month],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data } = await supabase
        .from("bank_transfers")
        .select("*")
        .eq("transfer_month", month)
        .order("transfer_date", { ascending: true })
      return (data || []) as BankTransfer[]
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always"
  })

  const { data: statementImports, refetch: refetchImports } = useQuery({
    queryKey: ["bank-statement-imports", month],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data } = await supabase
        .from("bank_statement_imports")
        .select("*")
        .eq("statement_month", month)
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
    await supabase.from("bank_transfers").insert({
      user_id: userId,
      description: description.trim() || null,
      amount: parsedAmount,
      transfer_date: transferDate,
      transfer_month: month,
      direction,
      bank_name: resolvedBank
    })
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
    const { data: importRow } = await supabase
      .from("bank_statement_imports")
      .insert({
        user_id: userId,
        bank: resolvedBank,
        statement_month: month,
        file_name: statementFile.name
      })
      .select("id")
      .single()
    const importId = importRow?.id || null
    const transfers = rows.map((row) => ({
      user_id: userId,
      bank_name: resolvedBank,
      description: row.description,
      amount: Math.abs(row.amount),
      transfer_date: row.transfer_date,
      transfer_month: row.transfer_date.slice(0, 7),
      direction: row.amount >= 0 ? "entrada" : "saida",
      import_batch_id: importId
    }))
    await supabase.from("bank_transfers").insert(transfers)
    setStatementFile(null)
    setStatementBank("")
    setCustomStatementBank("")
    refetchImports()
    refetch()
  }

  async function removeStatementImport(id: string) {
    const supabase = getSupabase()
    await supabase.from("bank_transfers").delete().eq("import_batch_id", id)
    await supabase.from("bank_statement_imports").delete().eq("id", id)
    refetchImports()
    refetch()
  }

  return (
    <main className="p-4 space-y-6">
      <AppHeader title={`Conta Bancária — ${month}`} />
      <div className="flex flex-wrap gap-2">
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(-1)}>
          Mês anterior
        </Button>
        <Button className="bg-secondary text-secondary-foreground hover:brightness-110" onClick={() => addMonth(1)}>
          Próximo mês
        </Button>
        <Button onClick={() => refetch()}>Atualizar</Button>
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
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor"
            className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
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
          {(data || []).length === 0 && !isLoading && <div className="text-muted-foreground">Sem transferências.</div>}
          {(data || []).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background-elevated p-3 shadow-[0_5px_12px_rgba(6,10,18,0.14)]">
              <div>
                <div className="font-medium text-foreground">{item.description || "Transferência"}</div>
                {item.bank_name && <div className="text-xs text-muted-foreground">{item.bank_name}</div>}
                <div className="text-xs text-muted-foreground">{item.transfer_date}</div>
              </div>
              <div className={`font-semibold ${item.direction === "entrada" ? "text-success" : "text-danger"}`}>
                {item.direction === "entrada" ? "+" : "-"} R$ {Number(item.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  )
}
