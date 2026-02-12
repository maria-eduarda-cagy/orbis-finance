export type IncomeRule = {
  id: string
  user_id: string
  description: string
  amount: number
  day_of_month: number
  active: boolean
}

export type BillRule = {
  id: string
  user_id: string
  description: string
  amount: number
  day_of_month: number
  category: string | null
  active: boolean
}

export type Card = {
  id: string
  user_id: string
  name: string
  due_day: number
}

export type CardStatement = {
  id: string
  user_id: string
  card_id: string
  statement_month: string
  due_date: string
  amount_total: number
  status: "open" | "paid"
  paid_at: string | null
  snooze_until?: string | null
}

export type CardTransaction = {
  id: string
  user_id: string
  card_id: string
  statement_month: string
  due_date: string
  purchase_date: string
  category: string | null
  description: string | null
  installment: string | null
  amount_usd: number | null
  fx_rate: number | null
  amount_brl: number
  cards?: { name: string }
}

export type InvestmentSettings = {
  user_id: string
  monthly_amount: number
  monthly_percentage: number
}
