export function normalizeCategory(value?: string | null) {
  const raw = String(value || "").trim()
  if (!raw) return "Sem categoria"
  const base = raw.split("/")[0].trim() || "Sem categoria"
  const normalized = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (normalized.startsWith("educa")) return "Educação"
  if (normalized.includes("assistencia") || normalized.includes("odontolog") || normalized.includes("medic")) return "Saúde"
  if (normalized.includes("supermerc") || normalized.includes("restauran") || normalized.includes("aliment")) return "Alimentação"
  if (normalized.includes("casa") || normalized.includes("moradia") || normalized.includes("resid")) return "Moradia"
  if (normalized.includes("servic")) return "Serviços"
  if (normalized.includes("transporte") || normalized.includes("mobilidade")) return "Transporte"
  if (normalized.includes("viagem")) return "Viagem"
  if (normalized.includes("compras")) return "Compras"
  if (normalized.includes("marketing")) return "Marketing Direto"

  return base
}
