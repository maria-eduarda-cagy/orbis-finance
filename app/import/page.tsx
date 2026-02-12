"use client"
import { useState } from "react"
import { getSupabase } from "../../lib/supabaseClient"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"

type ParsedRow = {
  card_name: string
  statement_month: string
  due_date: string
  amount_total: number
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(",").map((s) => s.trim())
  const idx = {
    card_name: header.indexOf("card_name"),
    statement_month: header.indexOf("statement_month"),
    due_date: header.indexOf("due_date"),
    amount_total: header.indexOf("amount_total")
  }
  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((s) => s.trim())
    const amount = Number(cols[idx.amount_total])
    rows.push({
      card_name: cols[idx.card_name],
      statement_month: cols[idx.statement_month],
      due_date: cols[idx.due_date],
      amount_total: isNaN(amount) ? 0 : amount
    })
  }
  return rows
}

export default function ImportPage() {
  const [fileText, setFileText] = useState<string>("")
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMessage(null)
    const f = e.target.files?.[0]
    if (!f) return
    const txt = await f.text()
    setFileText(txt)
    setRows(parseCsv(txt))
  }

  async function upsertRows() {
    setLoading(true)
    setMessage(null)
    const supabase = getSupabase()
    for (const r of rows) {
      const { data: cards } = await supabase.from("cards").select("*").eq("name", r.card_name).limit(1)
      let cardId = cards?.[0]?.id as string | undefined
      if (!cardId) {
        const { data: created } = await supabase.from("cards").insert({ name: r.card_name, due_day: new Date(r.due_date).getDate() }).select().single()
        cardId = created?.id
      }
      await supabase
        .from("card_statements")
        .upsert({
          card_id: cardId,
          statement_month: r.statement_month,
          due_date: r.due_date,
          amount_total: r.amount_total,
          status: "open"
        }, { onConflict: "user_id,card_id,statement_month" })
    }
    setLoading(false)
    setMessage("Importação concluída")
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Importar faturas CSV</h1>
      <Card>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} />
        {rows.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-neutral-600">Linhas: {rows.length}</div>
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
