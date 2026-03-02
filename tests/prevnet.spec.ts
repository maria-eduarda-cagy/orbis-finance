import { describe, it, expect } from "vitest"
import { computePrevNet } from "../lib/projection"

describe("computePrevNet", () => {
  it("computes prevNet as projected net of previous month (no transfers)", () => {
    const incomes = [{ amount: 3000 } as any]
    const bills = [{ amount: 1000 } as any]
    const statements = [{ amount_total: 800 } as any]
    const res = computePrevNet(incomes, bills, statements)
    expect(res).toBe(1200) // 3000 - 1000 - 800
  })

  it("handles zero transfers", () => {
    const incomes = [{ amount: 5000 } as any]
    const bills = [{ amount: 1500 } as any]
    const statements = [{ amount_total: 2000 } as any]
    const res = computePrevNet(incomes, bills, statements)
    expect(res).toBe(1500)
  })

  it("supports multiple lines and ignores transfers", () => {
    const incomes = [{ amount: 4000 } as any, { amount: 500 } as any]
    const bills = [{ amount: 1200 } as any, { amount: 300 } as any]
    const statements = [{ amount_total: 900 } as any]
    const res = computePrevNet(incomes, bills, statements)
    // (4500) - (1500) - (900) = 2100
    expect(res).toBe(2100)
  })
})
