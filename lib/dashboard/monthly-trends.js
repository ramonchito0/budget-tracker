export function getMonthlyTrends(transactions) {
  const map = {}

  transactions.forEach(tx => {
    const date = new Date(tx.spent_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`

    if (!map[key]) {
      map[key] = {
        month: date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        income: 0,
        expense: 0,
      }
    }

    if (tx.type === "income") {
      map[key].income += Number(tx.amount)
    } else {
      map[key].expense += Number(tx.amount)
    }
  })

  return Object.values(map)
}