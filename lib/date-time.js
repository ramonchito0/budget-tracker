export function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()

  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 10) return "Just now"
  if (diffSec < 60) return `${diffSec} sec ago`
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay} days ago`

  // fallback for older dates
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatShortDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()

  const isCurrentYear = date.getFullYear() === now.getFullYear()

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(isCurrentYear ? {} : { year: "numeric" }),
  })
}
