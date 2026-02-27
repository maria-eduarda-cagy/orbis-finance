import { describe, it, expect } from "vitest"
import { computeMonthlyProjection, unifyCardStatements } from "../lib/projection"

describe("unifyCardStatements and projection totals", () => {
  const month = "2026-02"

  it("uses manual totals when there are no imported statements", () => {
    const unified = unifyCardStatements([], [{ id: "1", user_id: "u", card_name: "C6", amount_total: 500, statement_month: month }], month as any)
    expect(unified.length).toBe(1)
    expect(unified[0].amount_total).toBe(500)
    const proj = computeMonthlyProjection([], [], unified, 0, 0)
    expect(proj.totalStatements).toBe(500)
  })

  it("prefers imported statements over manual totals to avoid double count", () => {
    const imported = [{ id: "st1", user_id: "u", card_id: "c6", statement_month: month, due_date: `${month}-28`, amount_total: 700, status: "open", paid_at: null, snooze_until: null } as any]
    const manual = [{ id: "1", user_id: "u", card_name: "C6", amount_total: 500, statement_month: month }]
    const unified = unifyCardStatements(imported as any, manual as any, month as any)
    expect(unified.length).toBe(1)
    const proj = computeMonthlyProjection([], [], unified as any, 0, 0)
    expect(proj.totalStatements).toBe(700)
  })
})
