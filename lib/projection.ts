import { getSupabase } from "./supabaseClient"
import { BillRule, CardStatement, IncomeRule } from "./types"

export async function fetchMonthData(month: string) {
  try {
    const supabase = getSupabase()
    const { data: incomes } = await supabase
      .from("income_rules")
      .select("*")
      .eq("active", true)
    const { data: bills } = await supabase
      .from("bill_rules")
      .select("*")
      .eq("active", true)
    const { data: statements } = await supabase
      .from("card_statements")
      .select("*")
      .eq("statement_month", month)
      .eq("status", "open")
    return {
      incomes: (incomes || []) as IncomeRule[],
      bills: (bills || []) as BillRule[],
      statements: (statements || []) as CardStatement[]
    }
  } catch {
    return { incomes: [], bills: [], statements: [] }
  }
}

export function computeMonthlyProjection(incomes: IncomeRule[], bills: BillRule[], statements: CardStatement[]) {
  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0)
  const totalBills = bills.reduce((s, r) => s + r.amount, 0)
  const totalStatements = statements.reduce((s, st) => s + st.amount_total, 0)
  const net = totalIncome - totalBills - totalStatements
  return { totalIncome, totalBills, totalStatements, net }
}

export function computeDailyAllowance(net: number, daysRemaining: number) {
  if (daysRemaining <= 0) return 0
  return Math.floor(net / daysRemaining)
}
