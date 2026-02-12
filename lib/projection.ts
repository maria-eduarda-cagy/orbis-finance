import { getSupabase } from "./supabaseClient"
import { BillRule, CardStatement, IncomeRule, CardTransaction } from "./types"

export async function fetchMonthData(month: string) {
  try {
    const supabase = getSupabase()
    const [yStr, mStr] = month.split("-")
    const y = Number(yStr)
    const m = Number(mStr)
    const prevMonth = new Date(y, (m || 1) - 2, 1)
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`
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
    const { data: prevStatements } = await supabase
      .from("card_statements")
      .select("*")
      .eq("statement_month", prevMonthStr)
      .eq("status", "open")
    const { data: transactions } = await supabase
      .from("card_transactions")
      .select("*, cards(name)")
      .eq("statement_month", month)
      .order("purchase_date", { ascending: true })
    const { data: prevTransactions } = await supabase
      .from("card_transactions")
      .select("amount_brl")
      .eq("statement_month", prevMonthStr)
    return {
      incomes: (incomes || []) as IncomeRule[],
      bills: (bills || []) as BillRule[],
      statements: (statements || []) as CardStatement[],
      transactions: (transactions || []) as CardTransaction[],
      prevStatements: (prevStatements || []) as CardStatement[],
      prevTransactions: (prevTransactions || []) as { amount_brl: number }[]
    }
  } catch {
    return { incomes: [], bills: [], statements: [], transactions: [], prevStatements: [], prevTransactions: [] }
  }
}

export function computeMonthlyProjection(
  incomes: IncomeRule[],
  bills: BillRule[],
  statements: CardStatement[],
  extraIncome = 0,
  extraExpense = 0
) {
  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0) + extraIncome
  const totalBills = bills.reduce((s, r) => s + r.amount, 0) + extraExpense
  const totalStatements = statements.reduce((s, st) => s + st.amount_total, 0)
  const net = totalIncome - totalBills - totalStatements
  return { totalIncome, totalBills, totalStatements, net }
}

export function computeDailyAllowance(net: number, daysRemaining: number) {
  if (daysRemaining <= 0) return 0
  return Math.floor(net / daysRemaining)
}
