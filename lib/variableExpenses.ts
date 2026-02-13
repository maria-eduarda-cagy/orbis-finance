import { VariableExpense } from "./types"

export function buildVariableExpenseMap(expenses: VariableExpense[], month: string) {
  const map = new Map<number, number>()
  for (const e of expenses) {
    if (e.month !== month) continue
    const day = Number(e.day_of_month || 0)
    map.set(day, (map.get(day) || 0) + Number(e.amount || 0))
  }
  return map
}

export function totalVariableExpensesForMonth(expenses: VariableExpense[], month: string) {
  return expenses
    .filter((e) => e.month === month)
    .reduce((s, e) => s + Number(e.amount || 0), 0)
}
