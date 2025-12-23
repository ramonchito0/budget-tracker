
export function formatTime(dateString) {
  const date = new Date(dateString)

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}