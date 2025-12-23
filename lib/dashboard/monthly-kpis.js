/**
 * Calculate total + percentage change vs last month
 *
 * @param {Array} expenses
 * @param {"income"|"expense"} type
 */
export function getMonthlyKPI(expenses = [], type) {
  const now = new Date()

  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const lastMonth = lastMonthDate.getMonth()
  const lastYear = lastMonthDate.getFullYear()

  let currentTotal = 0
  let lastTotal = 0

  for (const tx of expenses) {
    if (tx.type !== type) continue

    const d = new Date(tx.spent_at)

    if (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    ) {
      currentTotal += Number(tx.amount)
    }

    if (
      d.getMonth() === lastMonth &&
      d.getFullYear() === lastYear
    ) {
      lastTotal += Number(tx.amount)
    }
  }

  let percentChange = null

  if (lastTotal > 0) {
    percentChange =
      ((currentTotal - lastTotal) / lastTotal) * 100
  }

  return {
    total: currentTotal,
    percentChange, // number | null
  }
}
