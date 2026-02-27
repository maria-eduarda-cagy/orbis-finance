import { describe, it, expect } from "vitest"
import { computeMonthlyProjection } from "../lib/projection"

type IncomeRule = { amount: number }
type BillRule = { amount: number }
type CardStatement = { amount_total: number }

describe("monthly projection with monthly incomes and variable expenses", () => {
  it("includes monthly incomes as extraIncome and subtracts variable expenses as extraExpense", () => {
    const incomes: IncomeRule[] = [{ amount: 1000 }, { amount: 500 }]
    const bills: BillRule[] = [{ amount: 300 }]
    const statements: CardStatement[] = [{ amount_total: 200 }]
    const monthlyIncomesTotal = 450 // receitas pontuais do mês
    const variableExpensesTotal = 250 // despesas variáveis do mês
    const investmentMonthly = 100 // investimentos

    const proj = computeMonthlyProjection(incomes as any, bills as any, statements as any, monthlyIncomesTotal, investmentMonthly + variableExpensesTotal)
    // totalIncome = 1500 + 450 = 1950
    // totalBills = 300 + (100 + 250) = 650
    // totalStatements = 200
    // net = 1950 - 650 - 200 = 1100
    expect(proj.totalIncome).toBe(1950)
    expect(proj.totalBills).toBe(650)
    expect(proj.totalStatements).toBe(200)
    expect(proj.net).toBe(1100)
  })
})
