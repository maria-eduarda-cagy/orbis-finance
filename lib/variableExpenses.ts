import { VariableExpense } from "./types"

export function buildVariableExpenseMap(list: VariableExpense[], month: string) {
  const map = new Map<string, number>()
  const items = (list || []).filter((e) => e.month === month)
  for (const e of items) {
    const day = e.day_of_month || 15
    const [yStr, mStr] = month.split("-")
    const y = Number(yStr)
    const m = Number(mStr) - 1
    const d = new Date(y, m, day)
    const key = d.toDateString()
    map.set(key, (map.get(key) || 0) + Number(e.amount || 0))
  }
  return map
}

export function totalVariableExpensesForMonth(list: VariableExpense[], month: string) {
  return (list || [])
    .filter((e) => e.month === month)
    .reduce((s, e) => s + Number(e.amount || 0), 0)
}
