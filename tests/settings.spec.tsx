import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() })
}))

vi.mock("../components/format/CurrencyText", () => ({
  CurrencyText: ({ value }: { value: number }) => <span>R$ {Number(value).toFixed(2)}</span>
}))

// In-memory store to simulate DB per test
type TableName = "monthly_incomes" | "variable_expenses"
const store: Record<TableName, any[]> = {
  monthly_incomes: [],
  variable_expenses: []
}

function supabaseTable(name: TableName) {
  return {
    select: () => ({
      eq: (_col: string, val: string) => ({
        order: () => ({ data: store[name].filter((r: any) => r.month === val), error: null })
      }),
      single: () => ({ data: null, error: null })
    }),
    insert: (row: any) => {
      const data = { id: crypto.randomUUID(), ...row }
      store[name].push(data)
      return { data, error: null, select: () => ({ single: () => ({ data, error: null }) }) }
    },
    delete: () => ({
      eq: (_col: string, id: string) => {
        const idx = store[name].findIndex((r: any) => r.id === id)
        if (idx >= 0) store[name].splice(idx, 1)
        return { error: null }
      }
    })
  }
}

vi.mock("../lib/supabaseClient", () => ({
  getSupabase: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "u-test" } } })
    },
    from: (table: string | TableName) => {
      if (table !== "monthly_incomes" && table !== "variable_expenses") {
        // generic empty tables used on initial load
        return {
          select: () => ({
            order: () => ({ data: [], error: null }),
            eq: () => ({ order: () => ({ data: [], error: null }) }),
            single: () => ({ data: null, error: null })
          })
        }
      }
      return supabaseTable(table)
    }
  })
}))

import SettingsPage from "../app/(app)/settings/page"
import { NumberVisibilityProvider } from "../components/visibility/NumberVisibilityProvider"

describe("SettingsPage integration (monthly incomes and variable expenses)", () => {
  beforeEach(() => {
    store.monthly_incomes.length = 0
    store.variable_expenses.length = 0
  })

  it("adds monthly income and shows it in history", async () => {
    render(<NumberVisibilityProvider><SettingsPage /></NumberVisibilityProvider>)

    // Localiza a seção de Receita mensal (pontual)
    const receitaHeading = await screen.findAllByText("Receita mensal (pontual)")
    const receitaSection = receitaHeading[0].parentElement!.parentElement!
    const withinReceita = within(receitaSection)
    const miDesc = withinReceita.getByPlaceholderText("Descrição")
    const miValor = withinReceita.getByPlaceholderText("Valor")
    const miDia = withinReceita.getByPlaceholderText("Dia do mês")

    fireEvent.change(miDesc, { target: { value: "Bônus" } })
    fireEvent.change(miValor, { target: { value: "250.50" } })
    fireEvent.change(miDia, { target: { value: "10" } })

    fireEvent.click(withinReceita.getByText("Adicionar receita do mês"))

    await waitFor(() => {
      const histTitle = withinReceita.getByText(/Histórico do mês/i)
      expect(histTitle).toBeInTheDocument()
      expect(withinReceita.getByText(/Bônus/)).toBeInTheDocument()
      expect(withinReceita.getByText("R$ 250.50")).toBeInTheDocument()
    })
  })

  it("adds variable expense and shows it in history", async () => {
    render(<NumberVisibilityProvider><SettingsPage /></NumberVisibilityProvider>)

    const despesaHeading = await screen.findAllByText("Despesa variável")
    const despesaSection = despesaHeading[0].parentElement!.parentElement!
    const withinDespesa = within(despesaSection)
    const veDesc = withinDespesa.getByPlaceholderText("Descrição")
    const veValor = withinDespesa.getByPlaceholderText("Valor")
    const veDia = withinDespesa.getByPlaceholderText("Dia do mês")

    fireEvent.change(veDesc, { target: { value: "Mercado" } })
    fireEvent.change(veValor, { target: { value: "120" } })
    fireEvent.change(veDia, { target: { value: "5" } })

    fireEvent.click(withinDespesa.getByText("Adicionar despesa variável"))

    await waitFor(() => {
      const histTitle = withinDespesa.getByText(/Histórico do mês/i)
      expect(histTitle).toBeInTheDocument()
      expect(withinDespesa.getByText(/Mercado/)).toBeInTheDocument()
      expect(withinDespesa.getByText("R$ 120.00")).toBeInTheDocument()
    })
  })
})
