"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { getSupabase } from "../../../lib/supabaseClient"
import { Button } from "../../../components/ui/button"
import { Card } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { AppHeader } from "../../../components/AppHeader"
import { ConfirmButton } from "../../../components/ui/ConfirmButton"

type ParsedRow = {
  final_cartao: string
  data_compra: string
  categoria: string
  descricao: string
  parcela: string
  valor_usd: number
  cotacao_brl: number
  valor_brl: number
}

type ImportBatch = {
  id: string
  statement_month: string
  due_date: string
  bank: string
  file_name: string
  created_at: string
}

const bankOptions = ["C6", "XP"]

function detectDelimiter(line: string) {
  const semicolons = (line.match(/;/g) || []).length
  const commas = (line.match(/,/g) || []).length
  return semicolons >= commas ? ";" : ","
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim()
}

function parseBrl(value: string) {
  const cleanedRaw = value.replace(/[^\d,.-]/g, "")
  const hasComma = cleanedRaw.includes(",")
  const cleaned = hasComma
    ? cleanedRaw.replace(/\./g, "").replace(",", ".")
    : cleanedRaw
  const num = Number(cleaned)
  return isNaN(num) ? 0 : num
}

function parseCsv(text: string, bank: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return []
  const delimiter = detectDelimiter(lines[0])
  const header = lines[0].split(delimiter).map((s) => normalizeHeader(s))
  const isC6 = bank === "C6"
  const isXP = bank === "XP"
  const hasLegacyHeader = header.includes("Data de Compra") && header.includes("Final do Cartão")
  const hasNewHeader = header.includes("Data") && header.includes("Estabelecimento") && header.includes("Valor")
  const idx = {
    data_compra: header.indexOf(isC6 ? "Data de Compra" : "Data"),
    final_cartao: header.indexOf("Final do Cartão"),
    categoria: header.indexOf("Categoria"),
    descricao: header.indexOf(isC6 ? "Descrição" : "Estabelecimento"),
    parcela: header.indexOf("Parcela"),
    valor_usd: header.indexOf("Valor (em US$)"),
    cotacao_brl: header.indexOf("Cotação (em R$)"),
    valor_brl: header.indexOf(isC6 ? "Valor (em R$)" : "Valor")
  }
  if ((isC6 && !hasLegacyHeader) || (isXP && !hasNewHeader)) return []
  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((s) => s.trim())
    const amount = parseBrl(String(cols[idx.valor_brl] || ""))
    const amountUsd = parseBrl(String(cols[idx.valor_usd] || ""))
    const fxRate = parseBrl(String(cols[idx.cotacao_brl] || ""))
    rows.push({
      data_compra: cols[idx.data_compra],
      final_cartao: cols[idx.final_cartao] || "",
      categoria: cols[idx.categoria] || "",
      descricao: cols[idx.descricao] || "",
      parcela: cols[idx.parcela] || "",
      valor_usd: isNaN(amountUsd) ? 0 : amountUsd,
      cotacao_brl: isNaN(fxRate) ? 0 : fxRate,
      valor_brl: isNaN(amount) ? 0 : amount
    })
  }
  return rows
}

export default function ImportPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [statementMonth, setStatementMonth] = useState<string>("")
  const [bankName, setBankName] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const effectiveBank = bankName.trim()

  const { data: batchesData, isLoading: isLoadingBatches, isFetching: isFetchingBatches } = useQuery({
    queryKey: ["import-batches"],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data } = await supabase.from("import_batches").select("*").order("created_at", { ascending: false })
      return (data || []) as ImportBatch[]
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
    refetchIntervalInBackground: true
  })
  const batches = batchesData || []

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMessage(null)
    if (!bankName) {
      setMessage("Selecione o banco antes de importar o CSV.")
      e.target.value = ""
      return
    }
    const f = e.target.files?.[0]
    if (!f) return
    const txt = await f.text()
    setFileName(f.name || "")
    const parsed = parseCsv(txt, bankName)
    setRows(parsed)
    if (parsed.length === 0) {
      setMessage("Formato de CSV não reconhecido para o banco selecionado.")
    }
  }

  function extractDueDate(name: string) {
    const match = name.match(/(\d{4}-\d{2}-\d{2})/)
    if (!match) return null
    return match[1]
  }

  function monthFromDueDate(dueDate: string) {
    return dueDate.slice(0, 7)
  }

  function toIsoDateBr(value: string) {
    const parts = value.split("/")
    if (parts.length !== 3) return ""
    const [dd, mm, yyyy] = parts
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`
  }

  async function upsertRows() {
    setLoading(true)
    setMessage(null)
    const supabase = getSupabase()
    const dueDate = extractDueDate(fileName)
    if (!dueDate) {
      setLoading(false)
      setMessage("Nome do arquivo precisa conter data no formato YYYY-MM-DD (ex: Fatura_2026-02-10.csv).")
      return
    }
    if (!statementMonth) {
      setLoading(false)
      setMessage("Selecione o mês e ano da fatura.")
      return
    }
    if (!effectiveBank) {
      setLoading(false)
      setMessage("Selecione o banco do cartão.")
      return
    }
    const monthValue = statementMonth
    const dueDay = new Date(dueDate).getDate()
    const { data: batch } = await supabase
      .from("import_batches")
      .insert({
        statement_month: monthValue,
        due_date: dueDate,
        bank: effectiveBank,
        file_name: fileName || "CSV"
      })
      .select()
      .single()
    const batchId = batch?.id as string | undefined

    const totalsByCard = new Map<string, number>()
    const cardIdByFinal = new Map<string, string>()
    for (const r of rows) {
      const key = String(r.final_cartao || "").trim() || effectiveBank || "Cartão"
      if (!key) continue
      const amount = Number(r.valor_brl || 0)
      if (amount > 0) {
        totalsByCard.set(key, (totalsByCard.get(key) || 0) + amount)
      }
    }

    for (const [finalCartao, total] of totalsByCard.entries()) {
      const cardName = finalCartao && finalCartao !== effectiveBank
        ? `${effectiveBank} • Final ${finalCartao}`
        : effectiveBank
      const { data: cards } = await supabase.from("cards").select("*").eq("name", cardName).limit(1)
      let cardId = cards?.[0]?.id as string | undefined
      if (!cardId) {
        const { data: created } = await supabase.from("cards").insert({ name: cardName, due_day: dueDay }).select().single()
        cardId = created?.id
      }
      if (cardId) cardIdByFinal.set(finalCartao, cardId)
      await supabase
        .from("card_statements")
        .upsert(
          {
            card_id: cardId,
            statement_month: monthValue,
            due_date: dueDate,
            amount_total: total,
            status: "open",
            import_batch_id: batchId
          },
          { onConflict: "user_id,card_id,statement_month" }
        )
    }

    for (const r of rows) {
      const finalCartao = String(r.final_cartao || "").trim()
      const key = finalCartao || effectiveBank || "Cartão"
      const cardId = cardIdByFinal.get(key)
      if (!cardId) continue
      const purchaseDate = toIsoDateBr(r.data_compra)
      if (!purchaseDate) continue
      await supabase
        .from("card_transactions")
        .upsert(
          {
            card_id: cardId,
            statement_month: monthValue,
            due_date: dueDate,
            purchase_date: purchaseDate,
            category: r.categoria || null,
            description: r.descricao || null,
            installment: r.parcela || null,
            amount_usd: r.valor_usd || null,
            fx_rate: r.cotacao_brl || null,
            amount_brl: r.valor_brl,
            import_batch_id: batchId
          },
          { onConflict: "user_id,card_id,purchase_date,amount_brl,description,installment" }
        )
    }
    setLoading(false)
    setMessage("Importação concluída")
    await queryClient.invalidateQueries({ queryKey: ["import-batches"] })
    router.back()
  }

  async function deleteBatch(batch: ImportBatch) {
    setDeleteId(batch.id)
    const supabase = getSupabase()
    await supabase.from("card_transactions").delete().eq("import_batch_id", batch.id)
    await supabase.from("card_statements").delete().eq("import_batch_id", batch.id)
    await supabase.from("import_batches").delete().eq("id", batch.id)
    await queryClient.invalidateQueries({ queryKey: ["import-batches"] })
    setDeleteId(null)
    queryClient.invalidateQueries({ queryKey: ["month"] })
  }

  // cleanup-by-month removed per request

  return (
    <main className="relative min-h-screen">
      {((!batchesData && isLoadingBatches) || (isFetchingBatches && batches.length === 0)) && (
        <UpdatingOverlay label="Atualizando dados..." />
      )}
      <div className="md:hidden p-4 space-y-6">
        <AppHeader title="Importar faturas CSV" />
        <Card>
          <div className="mt-1 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Banco do cartão</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {bankOptions.map((option) => {
                  const active = bankName === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBankName(option)}
                      className={active
                        ? "rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1.5 text-sm"
                        : "rounded-full  bg-background-elevated text-muted-foreground px-3 py-1.5 text-sm hover:bg-background-subtle"}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Arquivo CSV</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`inline-flex items-center gap-2 rounded-full bg-background-elevated px-0 py-2 text-sm font-semibold transition-colors ${bankName ? "cursor-pointer hover:bg-background-subtle" : "cursor-not-allowed opacity-60"}`}>
                  Escolher arquivo
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFile}
                    className="hidden"
                    disabled={!bankName}
                  />
                </label>
                <span className="text-xs text-muted-foreground">
                  {fileName || "Nenhum arquivo selecionado"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Mês da fatura</label>
              <div className="flex flex-wrap items-start justify-start">
                <div className="inline-flex items-start justify-start rounded-full bg-background-elevated px-3 py-2 text-left text-sm font-semibold">
                  {statementMonth || ""}
                </div>
                <input
                  type="month"
                  value={statementMonth}
                  onChange={(e) => setStatementMonth(e.target.value)}
                  className="rounded-full bg-background-subtle text-foreground px-3.5 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
            </div>
            {rows.length > 0 && (
              <div className="pt-2">
                <div className="text-sm text-muted-foreground">Linhas: {rows.length}</div>
                <div className="text-xs text-muted-foreground">Arquivo: {fileName || "-"}</div>
                <Button className="mt-3" onClick={upsertRows} disabled={loading}>
                  {loading ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            )}
            {message && <div className="text-success text-sm">{message}</div>}
          </div>

          <div className="mt-8  pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Imports realizados</h3>
                <p className="text-sm text-muted-foreground">Remova um import específico e seus lançamentos.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {batches.length === 0 && <div className="text-sm text-muted-foreground">Nenhum import encontrado.</div>}
              {batches.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg  bg-background-elevated p-3">
                  <div className="text-sm">
                    <div className="font-medium">{b.bank} • {b.statement_month}</div>
                    <div className="text-muted-foreground">Vencimento: {b.due_date} • Arquivo: {b.file_name}</div>
                  </div>
                  <ConfirmButton onConfirm={() => deleteBatch(b)} label={deleteId === b.id ? "Removendo..." : "Remover import"} />
                </div>
              ))}
            </div>
          </div>

          
        </Card>
      </div>

      <div className="hidden md:block">
        <div className="pointer-events-none opacity-30">
          <div className="p-4">
            <AppHeader title="Importar faturas CSV" />
          </div>
        </div>
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => router.back()} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[calc(100vh-30px)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Importar faturas CSV</h2>
              <p className="text-sm text-muted-foreground">Selecione o arquivo e o mês/ano da fatura.</p>
            </div>
            <Button className="bg-secondary text-secondary-foreground  hover:brightness-110" onClick={() => router.back()}>
              Fechar
            </Button>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Banco do cartão</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {bankOptions.map((option) => {
                  const active = bankName === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBankName(option)}
                      className={active
                        ? "rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1.5 text-sm"
                        : "rounded-full  bg-background-elevated text-muted-foreground px-3 py-1.5 text-sm hover:bg-background-subtle"}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Arquivo CSV</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`inline-flex items-center gap-2 rounded-full bg-background-elevated px-0 py-2 text-sm font-semibold transition-colors ${bankName ? "cursor-pointer hover:bg-background-subtle" : "cursor-not-allowed opacity-60"}`}>
                  Escolher arquivo
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFile}
                    className="hidden"
                    disabled={!bankName}
                  />
                </label>
                <span className="text-xs text-muted-foreground">
                  {fileName || "Nenhum arquivo selecionado"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Mês da fatura</label>
              <div className="flex flex-wrap items-center justify-start gap-3">
               
                <input
                  type="month"
                  value={statementMonth}
                  onChange={(e) => setStatementMonth(e.target.value)}
                  className="rounded-full bg-background-subtle text-foreground px-3.5 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
                 <div className="inline-flex items-center justify-start rounded-full bg-background-elevated px-3 py-2 text-left text-sm font-semibold">
                  {statementMonth || ""}
                </div>
              </div>
            </div>
            {rows.length > 0 && (
              <div className="pt-2">
                <div className="text-sm text-muted-foreground">Linhas: {rows.length}</div>
                <div className="text-xs text-muted-foreground">Arquivo: {fileName || "-"}</div>
                <Button className="mt-3" onClick={upsertRows} disabled={loading}>
                  {loading ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            )}
            {message && <div className="text-success text-sm">{message}</div>}
          </div>

          <div className="mt-2  pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Imports realizados</h3>
                <p className="text-sm text-muted-foreground">Remova um import específico e seus lançamentos.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {batches.length === 0 && <div className="text-sm text-muted-foreground">Nenhum import encontrado.</div>}
              {batches.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg  bg-background-elevated p-3">
                  <div className="text-sm">
                    <div className="font-medium">{b.bank} • {b.statement_month}</div>
                    <div className="text-muted-foreground">Vencimento: {b.due_date} • Arquivo: {b.file_name}</div>
                  </div>
                  <Button
                    className="bg-secondary text-secondary-foreground  hover:brightness-110"
                    onClick={() => deleteBatch(b)}
                    disabled={deleteId === b.id}
                  >
                    {deleteId === b.id ? "Removendo..." : "Remover import"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          
          </Card>
        </div>
      </div>
    </main>
  )
}
