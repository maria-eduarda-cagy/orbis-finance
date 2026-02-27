import { getSupabase } from "./supabaseClient"
import { BillRule, CardStatement, IncomeRule, CardTransaction, VariableExpense, BankTransfer, MonthlyIncome, MonthlyCardTotal } from "./types"

export async function fetchMonthData(month: string) {
  try {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    const createdAt = auth.user?.created_at || null
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
    const { data: transfers } = await supabase
      .from("bank_transfers")
      .select("*")
      .eq("transfer_month", month)
      .order("transfer_date", { ascending: true })
    const { data: prevTransfers } = await supabase
      .from("bank_transfers")
      .select("amount,direction")
      .eq("transfer_month", prevMonthStr)
    const { data: transactions } = await supabase
      .from("card_transactions")
      .select("*, cards(name)")
      .eq("statement_month", month)
      .order("purchase_date", { ascending: true })
    const { data: prevTransactions } = await supabase
      .from("card_transactions")
      .select("amount_brl")
      .eq("statement_month", prevMonthStr)
    const { data: variableExpenses } = await supabase
      .from("variable_expenses")
      .select("*")
      .eq("month", month)
    const { data: monthlyIncomes } = await supabase
      .from("monthly_incomes")
      .select("*")
      .eq("month", month)
    const { data: investmentSettings } = await supabase
      .from("user_investment_settings")
      .select("monthly_percentage")
      .single()
    const { data: manualCardTotals } = await supabase
      .from("monthly_card_totals")
      .select("*")
      .eq("statement_month", month)
    const unifiedStatements = unifyCardStatements((statements || []) as CardStatement[], (manualCardTotals || []) as MonthlyCardTotal[], month)
    return {
      incomes: (incomes || []) as IncomeRule[],
      bills: (bills || []) as BillRule[],
      statements: unifiedStatements,
      transactions: (transactions || []) as CardTransaction[],
      prevStatements: (prevStatements || []) as CardStatement[],
      prevTransactions: (prevTransactions || []) as { amount_brl: number }[],
      transfers: (transfers || []) as BankTransfer[],
      prevTransfers: (prevTransfers || []) as { amount: number; direction: "entrada" | "saida" }[],
      userCreatedAt: createdAt,
      investmentPercentage: Number(investmentSettings?.monthly_percentage || 0),
      variableExpenses: (variableExpenses || []) as VariableExpense[],
      monthlyIncomes: (monthlyIncomes || []) as MonthlyIncome[]
    }
  } catch {
    return { incomes: [], bills: [], statements: [], transactions: [], prevStatements: [], prevTransactions: [], transfers: [], prevTransfers: [], userCreatedAt: null, investmentPercentage: 0, variableExpenses: [], monthlyIncomes: [] }
  }
}

export function unifyCardStatements(statements: CardStatement[], manualTotals: MonthlyCardTotal[], month: string): CardStatement[] {
  if ((statements?.length || 0) > 0) return statements
  return (manualTotals || []).map((m) => {
    const id = `manual-${m.card_name}-${m.statement_month}`
    // due_date aproximado no final do mês (dia 28) para projeções diárias
    const due_date = `${month}-28`
    return {
      id,
      user_id: m.user_id,
      card_id: `manual-${m.card_name}`,
      statement_month: m.statement_month,
      due_date,
      amount_total: Number(m.amount_total),
      status: "open",
      paid_at: null,
      snooze_until: null
    } as CardStatement
  })
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
