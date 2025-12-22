"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function ImportTransactionsButton() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file")
      return
    }

    setLoading(true)

    try {
      const text = await file.text()
      const rows = parseCSV(text)

      if (!rows.length) {
        toast.error("CSV file is empty")
        return
      }

      const inserts = rows.map(row => ({
        title: row["Title"],
        amount: Number(row["Amount"]),
        type: row["Type"],
        spent_at: row["Spent At"] || new Date().toISOString(),
      }))

      const { error } = await supabase
        .from("expenses")
        .insert(inserts)

      if (error) throw error

      toast.success(`Imported ${inserts.length} transactions`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to import transactions")
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        accept=".csv"
        hidden
        id="import-transactions"
        onChange={handleFile}
      />

      <Button
        variant="outline"
        className="gap-2"
        disabled={loading}
        onClick={() =>
          document.getElementById("import-transactions").click()
        }
      >
        <Upload className="h-4 w-4" />
        {loading ? "Importing…" : "Import Transactions (CSV)"}
      </Button>
    </div>
  )
}

/* ----------------------------------------
   Simple CSV parser (no deps)
---------------------------------------- */
function parseCSV(text) {
  const lines = text.trim().split("\n")
  const headers = lines.shift().split(",").map(h => h.replace(/"/g, ""))

  return lines.map(line => {
    const values = line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map(v => v.replace(/^"|"$/g, ""))

    const row = {}
    headers.forEach((h, i) => {
      row[h] = values[i]
    })
    return row
  })
}
