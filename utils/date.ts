export function formatMonth(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export function formatMonthLabel(month: string) {
  const [y, m] = month.split("-")
  if (!y || !m) return month
  return `${m}.${y}`
}

export function formatMonthTitle(month: string) {
  const [y, m] = month.split("-")
  if (!y || !m) return month
  return `${m}.${y}`
}

export function nextMonthStr(month: string) {
  const [yStr, mStr] = month.split("-")
  const y = Number(yStr)
  const m = Number(mStr)
  if (!y || !m) return month
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function daysInMonth(date: Date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  return new Date(y, m + 1, 0).getDate()
}
