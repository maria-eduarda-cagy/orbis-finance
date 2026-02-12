// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
const APP_URL = Deno.env.get("APP_URL") || ""

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function answerCallback(id: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, text })
  })
}

async function handleAction(action: string, id: string, chatId: string) {
  const { data: st } = await supabase.from("card_statements").select("*").eq("id", id).single()
  if (!st) return "Não encontrado"
  const { data: setting } = await supabase
    .from("user_notification_settings")
    .select("*")
    .eq("user_id", st.user_id)
    .single()
  if (!setting || String(setting.telegram_chat_id) !== String(chatId)) return "Chat inválido"
  if (action === "paid") {
    await supabase.from("card_statements").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id)
    return "Marcado como pago"
  }
  if (action === "snooze2") {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    await supabase.from("card_statements").update({ snooze_until: d.toISOString().slice(0, 10) }).eq("id", id)
    return "Notificação adiada"
  }
  if (action === "open") {
    return `${APP_URL}/dashboard/month`
  }
  return "Ação inválida"
}

export default async function handler(req: Request): Promise<Response> {
  const body = await req.json()
  if (body.callback_query) {
    const cb = body.callback_query
    const data = String(cb.data || "")
    const [action, id] = data.split(":")
    const chatId = cb.message?.chat?.id
    const res = await handleAction(action, id, String(chatId))
    await answerCallback(cb.id, res)
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } })
}
