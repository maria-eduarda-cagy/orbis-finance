import { describe, it, expect } from "vitest"
import { computePrevNet } from "../lib/projection"

describe("computePrevNet", () => {
  it("computes prevNet using incomes, bills, statements and net transfers", () => {
    const incomes = [{ amount: 3000 } as any]
    const bills = [{ amount: 1000 } as any]
    const statements = [{ amount_total: 800 } as any]
    const transfers = [{ amount: 200, direction: "entrada" }, { amount: 100, direction: "saida" }] as any
    const res = computePrevNet(incomes, bills, statements, transfers)
    expect(res).toBe(1300) // 3000 - 1000 - 800 + (200-100)
  })

  it("handles zero transfers", () => {
    const incomes = [{ amount: 5000 } as any]
    const bills = [{ amount: 1500 } as any]
    const statements = [{ amount_total: 2000 } as any]
    const res = computePrevNet(incomes, bills, statements, [])
    expect(res).toBe(1500)
  })

  it("supports multiple lines and negative transfer net", () => {
    const incomes = [{ amount: 4000 } as any, { amount: 500 } as any]
    const bills = [{ amount: 1200 } as any, { amount: 300 } as any]
    const statements = [{ amount_total: 900 } as any]
    const transfers = [{ amount: 50, direction: "entrada" }, { amount: 200, direction: "saida" }] as any
    const res = computePrevNet(incomes, bills, statements, transfers)
    // (4500) - (1500) - (900) + (50-200) = 1950
    expect(res).toBe(1950)
  })
})
