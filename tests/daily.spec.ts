import { describe, it, expect } from "vitest"
import { itemsForDay, projectDailyBalances } from "../lib/daily"
import { buildVariableExpenseMap } from "../lib/variableExpenses"

type IncomeRule = { day_of_month: number; amount: number }
type BillRule = { day_of_month: number; amount: number }
type CardStatement = { statement_month: string; due_date: string; amount_total: number }

function monthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

describe("daily balances with monthly incomes and variable expenses", () => {
  it("adds monthly income on the specific day and subtracts variable expense", () => {
    const base = new Date(2026, 0, 1) // Jan 2026
    const day = new Date(2026, 0, 10)
    const incomes: IncomeRule[] = [{ day_of_month: 10, amount: 100 }]
    const bills: BillRule[] = [{ day_of_month: 10, amount: 30 }]
    const statements: CardStatement[] = [{ statement_month: monthStr(day), due_date: day.toISOString(), amount_total: 20 }]
    const transfers: Array<{ amount: number; direction: "entrada" | "saida"; transfer_date: string; transfer_month: string }> =
      [{ amount: 50, direction: "entrada", transfer_date: day.toISOString(), transfer_month: monthStr(day) }]
    const variableExpenseMap = buildVariableExpenseMap([{ id: "1", user_id: "u", month: monthStr(day), day_of_month: 10, amount: 40, category: null } as any], monthStr(day))
    const monthlyIncomeMap = new Map<number, number>([[10, 200]])

    const res = itemsForDay(day, incomes as any, bills as any, statements as any, transfers, monthlyIncomeMap, variableExpenseMap)
    // incomeTotal = 100 (recorrente) + 200 (pontual) = 300
    // transferTotal = +50
    // expenseTotal = 30 (bills) + 20 (statements) + 40 (variável) = 90
    // netDelta = 300 + 50 - 90 = 260
    expect(res.netDelta).toBe(260)

    const balances = projectDailyBalances(base, incomes as any, bills as any, statements as any, transfers, monthlyIncomeMap, variableExpenseMap, 0)
    // ensure at least that the 10th day increases by netDelta relative to previous day
    const tenth = balances.find((b) => b.date.getDate() === 10)!
    const ninth = balances.find((b) => b.date.getDate() === 9)!
    expect(tenth.balance - ninth.balance).toBe(260)
  })
})
