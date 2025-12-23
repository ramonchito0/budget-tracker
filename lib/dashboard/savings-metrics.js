/**
 * Calculate savings-related metrics for the current month
 *
 * @param {number} totalIncome
 * @param {number} totalExpenses
 */
export function getSavingsMetrics(totalIncome, totalExpenses) {
  const balance = totalIncome - totalExpenses

  let savingsRate = null

  if (totalIncome > 0) {
    savingsRate = (balance / totalIncome) * 100
  }

  return {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate, // number | null
  }
}
