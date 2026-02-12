// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
const APP_URL = Deno.env.get("APP_URL") || ""

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

async function alreadySent(user_id: string, entity_id: string, notify_days_before: number, dateStr: string) {
  const { data } = await supabase
    .from("notification_log")
    .select("id")
    .eq("user_id", user_id)
    .eq("entity_id", entity_id)
    .eq("type", "card_statement_due")
    .eq("notify_days_before", notify_days_before)
    .gte("sent_at", `${dateStr}T00:00:00Z`)
    .lte("sent_at", `${dateStr}T23:59:59Z`)
  return (data || []).length > 0
}

async function sendTelegram(chatId: string, text: string, inline: any[]) {
  const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: { inline_keyboard: [inline] }
    })
  })
  return resp.ok
}

export default async function handler(req: Request): Promise<Response> {
  const now = new Date()
  const todayStr = formatDate(now)
  const { data: settings } = await supabase
    .from("user_notification_settings")
    .select("*")
    .eq("enabled", true)
  for (const s of settings || []) {
    const notifyDays = s.notify_days_before as number
    const target = new Date(now)
    target.setDate(target.getDate() + notifyDays)
    const targetStr = formatDate(target)
    const { data: statements } = await supabase
      .from("card_statements")
      .select("*")
      .eq("user_id", s.user_id)
      .eq("status", "open")
      .eq("due_date", targetStr)
      .or(`snooze_until.is.null,snooze_until.lt.${targetStr}`)
    for (const st of statements || []) {
      const sent = await alreadySent(s.user_id, st.id, notifyDays, todayStr)
      if (sent) continue
      const { data: card } = await supabase.from("cards").select("*").eq("id", st.card_id).single()
      const text = `Fatura: ${card?.name}\nVencimento: ${st.due_date}\nValor: R$ ${Number(st.amount_total).toFixed(2)}`
      const ok = await sendTelegram(
        s.telegram_chat_id,
        text,
        [
          { text: "✅ Pagar", callback_data: `paid:${st.id}` },
          { text: "⏰ Adiar 2 dias", callback_data: `snooze2:${st.id}` },
          { text: "📄 Abrir", callback_data: `open:${st.id}` }
        ]
      )
      if (ok) {
        await supabase.from("notification_log").insert({
          user_id: s.user_id,
          type: "card_statement_due",
          entity_id: st.id,
          notify_days_before: notifyDays
        })
      }
    }
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } })
}
