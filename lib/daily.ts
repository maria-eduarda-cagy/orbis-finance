import { BillRule, CardStatement, IncomeRule } from "./types"

export function buildMonthDays(selectedDate: Date) {
  const y = selectedDate.getFullYear()
  const m = selectedDate.getMonth()
  const days = new Date(y, m + 1, 0).getDate()
  const list: Date[] = []
  for (let d = 1; d <= days; d++) list.push(new Date(y, m, d))
  return list
}

export function itemsForDay(
  date: Date,
  incomes: IncomeRule[],
  bills: BillRule[],
  statements: CardStatement[],
  transfers: { amount: number; direction: "entrada" | "saida"; transfer_date: string; transfer_month: string }[] = [],
  variableExpenseMap?: Map<number, number>
) {
  const day = date.getDate()
  const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  const incs = incomes.filter((r) => r.day_of_month === day)
  const bls = bills.filter((r) => r.day_of_month === day)
  const sts = statements.filter((s) => s.statement_month === monthStr && new Date(s.due_date).getDate() === day)
  const tfs = transfers.filter((t) => t.transfer_month === monthStr && new Date(t.transfer_date).getDate() === day)
  const incomeTotal = incs.reduce((s, r) => s + r.amount, 0)
  const transferTotal = tfs.reduce((s, t) => s + (t.direction === "entrada" ? t.amount : -t.amount), 0)
  const variableTotal = variableExpenseMap?.get(day) || 0
  const expenseTotal = bls.reduce((s, r) => s + r.amount, 0) + sts.reduce((s, r) => s + r.amount_total, 0) + variableTotal
  const netDelta = incomeTotal + transferTotal - expenseTotal
  return { incs, bls, sts, tfs, netDelta }
}

export function projectDailyBalances(
  selectedDate: Date,
  incomes: IncomeRule[],
  bills: BillRule[],
  statements: CardStatement[],
  transfers: { amount: number; direction: "entrada" | "saida"; transfer_date: string; transfer_month: string }[] = [],
  variableExpenseMap?: Map<number, number>,
  startBalance = 0
) {
  const days = buildMonthDays(selectedDate)
  let balance = startBalance
  const result = days.map((d) => {
    const { netDelta } = itemsForDay(d, incomes, bills, statements, transfers, variableExpenseMap)
    balance += netDelta
    const daysRemaining = days.length - d.getDate()
    const allowance = daysRemaining > 0 ? Math.max(0, Math.floor(balance / daysRemaining)) : 0
    return { date: d, balance, allowance }
  })
  return result
}
