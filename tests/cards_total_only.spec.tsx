import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import CardsPage from "../app/(app)/cards/page"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NumberVisibilityProvider } from "../components/visibility/NumberVisibilityProvider"

vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>
}))

vi.mock("../lib/supabaseClient", () => ({
  getSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u" } } }) },
    from: (table: string) => {
      if (table === "user_card_mode") {
        return { select: () => ({ single: () => ({ data: { mode: "total_only" } }) }) }
      }
      if (table === "monthly_card_totals") {
        return { upsert: () => ({}) }
      }
      return { select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }) }
    }
  })
}))

describe("CardsPage in total_only mode", () => {
  it("shows manual total form", async () => {
    const client = new QueryClient()
    render(<QueryClientProvider client={client}><NumberVisibilityProvider><CardsPage /></NumberVisibilityProvider></QueryClientProvider>)
    const heading = await screen.findByText("Lançamentos do cartão")
    expect(heading).toBeInTheDocument()
    const label = await screen.findByText("Mês da fatura")
    expect(label).toBeInTheDocument()
    expect(screen.getByText("Salvar valor do cartão")).toBeInTheDocument()
  })
})
