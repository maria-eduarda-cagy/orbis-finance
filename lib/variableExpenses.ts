import { VariableExpense } from "./types"

export function buildVariableExpenseMap(list: VariableExpense[], month: string) {
  const map = new Map<number, number>()
  const items = (list || []).filter((e) => e.month === month)
  for (const e of items) {
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
