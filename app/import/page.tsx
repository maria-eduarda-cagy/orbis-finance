"use client"
import { useState } from "react"
import { getSupabase } from "../../lib/supabaseClient"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { AppHeader } from "../../components/AppHeader"

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

function detectDelimiter(line: string) {
  const semicolons = (line.match(/;/g) || []).length
  const commas = (line.match(/,/g) || []).length
  return semicolons >= commas ? ";" : ","
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return []
  const delimiter = detectDelimiter(lines[0])
  const header = lines[0].split(delimiter).map((s) => s.trim())
  const idx = {
    data_compra: header.indexOf("Data de Compra"),
    final_cartao: header.indexOf("Final do Cartão"),
    categoria: header.indexOf("Categoria"),
    descricao: header.indexOf("Descrição"),
    parcela: header.indexOf("Parcela"),
    valor_usd: header.indexOf("Valor (em US$)"),
    cotacao_brl: header.indexOf("Cotação (em R$)"),
    valor_brl: header.indexOf("Valor (em R$)")
  }
  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((s) => s.trim())
    const amount = Number(String(cols[idx.valor_brl] || "").replace(",", "."))
    const amountUsd = Number(String(cols[idx.valor_usd] || "").replace(",", "."))
    const fxRate = Number(String(cols[idx.cotacao_brl] || "").replace(",", "."))
    rows.push({
      data_compra: cols[idx.data_compra],
      final_cartao: cols[idx.final_cartao],
      categoria: cols[idx.categoria],
      descricao: cols[idx.descricao],
      parcela: cols[idx.parcela],
      valor_usd: isNaN(amountUsd) ? 0 : amountUsd,
      cotacao_brl: isNaN(fxRate) ? 0 : fxRate,
      valor_brl: isNaN(amount) ? 0 : amount
    })
  }
  return rows
}

export default function ImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [statementMonth, setStatementMonth] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMessage(null)
    const f = e.target.files?.[0]
    if (!f) return
    const txt = await f.text()
    setFileName(f.name || "")
    setRows(parseCsv(txt))
    const dueDateFromName = extractDueDate(f.name || "")
    if (dueDateFromName) setStatementMonth(monthFromDueDate(dueDateFromName))
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
    const monthValue = statementMonth || monthFromDueDate(dueDate)
    if (!monthValue) {
      setLoading(false)
      setMessage("Selecione o mês da fatura.")
      return
    }
    const dueDay = new Date(dueDate).getDate()

    const totalsByCard = new Map<string, number>()
    const cardIdByFinal = new Map<string, string>()
    for (const r of rows) {
      const key = String(r.final_cartao || "").trim()
      if (!key) continue
      totalsByCard.set(key, (totalsByCard.get(key) || 0) + r.valor_brl)
    }

    for (const [finalCartao, total] of totalsByCard.entries()) {
      const cardName = `Final ${finalCartao}`
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
            status: "open"
          },
          { onConflict: "user_id,card_id,statement_month" }
        )
    }

    for (const r of rows) {
      const finalCartao = String(r.final_cartao || "").trim()
      const cardId = cardIdByFinal.get(finalCartao)
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
            amount_brl: r.valor_brl
          },
          { onConflict: "user_id,card_id,purchase_date,amount_brl,description,installment" }
        )
    }
    setLoading(false)
    setMessage("Importação concluída")
  }

  return (
    <main className="p-4 space-y-4">
      <AppHeader title="Importar faturas CSV" />
      <Card>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} />
        <div className="mt-3">
          <label className="text-sm">Mês da fatura</label>
          <Input
            type="month"
            value={statementMonth}
            onChange={(e) => setStatementMonth(e.target.value)}
            placeholder="YYYY-MM"
          />
        </div>
        {rows.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-neutral-600">Linhas: {rows.length}</div>
            <div className="text-xs text-neutral-500">Usando data do arquivo: {fileName || "-"}</div>
            <Button className="mt-2" onClick={upsertRows} disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        )}
      </Card>
      {message && <div className="text-green-700">{message}</div>}
    </main>
  )
}
