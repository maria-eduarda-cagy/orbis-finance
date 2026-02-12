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
