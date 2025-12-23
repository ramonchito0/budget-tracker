/**
 * Get expense totals by category for the current month
 *
 * @param {Array} expenses
 * @returns {Array<{ name: string, value: number }>}
 */
export function getSpendingByCategoryThisMonth(expenses = []) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const categoryMap = {}

  for (const tx of expenses) {
    // Only expenses
    if (tx.type !== "expense") continue

    const d = new Date(tx.spent_at)

    // Only current month
    if (
      d.getMonth() !== currentMonth ||
      d.getFullYear() !== currentYear
    ) {
      continue
    }

    const category = tx.category?.name || "Uncategorized"

    if (!categoryMap[category]) {
      categoryMap[category] = 0
    }

    categoryMap[category] += Number(tx.amount)
  }

  return Object.entries(categoryMap).map(
    ([name, value]) => ({
      name,
      value,
    })
  )
}
