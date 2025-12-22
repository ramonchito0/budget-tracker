import { createClient } from "@/lib/supabase/client"

export async function exportTransactionsCSV() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("expenses")
    .select(`
      title,
      amount,
      type,
      spent_at,
      created_at,
      categories ( name )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  if (!data || !data.length) return

  const headers = [
    "Title",
    "Amount",
    "Type",
    "Category",
    "Spent At",
    "Created At",
  ]

  const rows = data.map(tx => [
    tx.title,
    tx.amount,
    tx.type,
    tx.categories?.name || "",
    tx.spent_at,
    tx.created_at,
  ])

  const csv = [
    headers.join(","),
    ...rows.map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n")

  downloadFile(csv, "transactions.csv", "text/csv")
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
