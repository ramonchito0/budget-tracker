export function formatPeso(amount) {
  return `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPesoCompact(amount) {
  if (amount >= 1_000_000) {
    return (
      "₱" +
      (amount / 1_000_000)
        .toFixed(1)
        .replace(/\.0$/, "") +
      "M"
    )
  }

  if (amount >= 1_000) {
    return (
      "₱" +
      (amount / 1_000)
        .toFixed(1)
        .replace(/\.0$/, "") +
      "k"
    )
  }

  return "₱" + amount.toLocaleString()
}
