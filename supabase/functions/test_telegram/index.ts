// Telegram (temporariamente desativado)
// export default async function handler(req: Request): Promise<Response> {
//   try {
//     const url = new URL(req.url)
//     const dry = url.searchParams.get("dry") === "1"
//     const env = (globalThis as any).Deno?.env
//     const token = env?.get("TELEGRAM_BOT_TOKEN")
//     const chatId = env?.get("TELEGRAM_CHAT_ID")
//     if (dry) {
//       return new Response(
//         JSON.stringify({
//           ok: true,
//           diagnostics: {
//             method: req.method,
//             hasEnv: Boolean(env),
//             hasToken: Boolean(token),
//             hasChatId: Boolean(chatId)
//           }
//         }),
//         { headers: { "content-type": "application/json" } }
//       )
//     }
//     if (!token || !chatId) {
//       return new Response(JSON.stringify({ ok: false, error: "missing secrets" }), {
//         status: 500,
//         headers: { "content-type": "application/json" }
//       })
//     }
//     const payload = { chat_id: chatId, text: "Teste de notificação via Supabase Edge Functions" }
//     const controller = new AbortController()
//     const timeout = setTimeout(() => controller.abort(), 3000)
//     const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify(payload),
//       signal: controller.signal
//     })
//     clearTimeout(timeout)
//     if (!r.ok) {
//       const txt = await r.text()
//       return new Response(JSON.stringify({ ok: false, error: txt }), {
//         status: 502,
//         headers: { "content-type": "application/json" }
//       })
//     }
//     return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } })
//   } catch (e) {
//     const name = (e as any)?.name || ""
//     const status = name === "AbortError" ? 504 : 500
//     return new Response(JSON.stringify({ ok: false, error: name === "AbortError" ? "timeout" : String(e) }), {
//       status,
//       headers: { "content-type": "application/json" }
//     })
//   }
// }

export default async function handler(_req: Request): Promise<Response> {
  return new Response(JSON.stringify({ ok: false, error: "Telegram desativado temporariamente." }), {
    status: 503,
    headers: { "content-type": "application/json" }
  })
}
