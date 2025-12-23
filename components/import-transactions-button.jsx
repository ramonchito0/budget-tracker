"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogDescription } from "@radix-ui/react-dialog"

export default function ImportTransactionsButton() {
  const supabase = createClient()

  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)


  /* =============================
     FILE SELECT
  ============================= */
async function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (!file.name.toLowerCase().endsWith(".csv")) {
    toast.error("Please upload a CSV file")
    return
  }

  try {
    const text = await file.text()
    const parsed = parseCSV(text)

    if (!parsed.length) {
      toast.error("CSV file is empty")
      return
    }

    const normalized = []
    let skipped = 0

    parsed.forEach((row, index) => {
      try {

        const spentAt =
        row.spent_at ||
        row["spent at"] ||
        row["Spent At"] ||
        row["SPENT AT"]

        if (row.title && row.amount && spentAt) {
          const date = new Date(spentAt)

          if (isNaN(date.getTime())) {
            throw new Error("Invalid date")
          }

          normalized.push({
            title: String(row.title).trim(),
            amount: Number(row.amount),
            type:
              String(row.type).toLowerCase() === "income"
                ? "income"
                : "expense",
            category: row.category?.trim() || null,
            spent_at: new Date(spentAt).toISOString(),
          })
          return
        }

        // 🔁 CASE 2: External / legacy CSV → normalize
        const n = normalizeRow(row, index)
        if (n) normalized.push(n)
      } catch (err) {
        skipped++
      }
    })


    if (!normalized.length) {
      toast.error("No valid rows found in CSV")
      return
    }

    if (skipped > 0) {
      toast.warning(`${skipped} row(s) skipped due to invalid data`)
    }

    setRows(normalized)
    setOpen(true)
  } catch (err) {
    console.error(err)
    toast.error("Failed to read CSV file")
  } finally {
    e.target.value = ""
  }
}


  /* =============================
     CONFIRM IMPORT
  ============================= */
async function handleImport() {
  setLoading(true)
  setProgress(0)

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!user) throw new Error("Not authenticated")

    const userId = user.id
    const total = rows.length
    const inserts = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      let category_id = null
      if (row.category) {
        category_id = await resolveCategory(
          supabase,
          userId,
          row.category,
          row.type
        )
      }

      inserts.push({
        user_id: userId,
        title: row.title,
        amount: row.amount,
        type: row.type,
        category_id,
        spent_at: row.spent_at,
      })

      // Update progress
      const percent = Math.round(((i + 1) / total) * 100)
      setProgress(percent)
    }

    const { error } = await supabase
      .from("expenses")
      .insert(inserts)

    if (error) throw error

    toast.success(`Successfully imported ${inserts.length} transactions 🎉`)
    setRows([])
    setOpen(false)
  } catch (err) {
    console.error("Import failed:", err)
    toast.error(err?.message || "Import failed")
  } finally {
    setLoading(false)
    setProgress(0)
  }
}




  /* =============================
     CATEGORY RESOLVER
  ============================= */
async function resolveCategory(supabase, userId, name, type) {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("name", name)
    .eq("type", type)
    .eq("user_id", userId)
    .single()

  if (data) return data.id

  const { data: created, error } = await supabase
    .from("categories")
    .insert({
      name,
      type,
      user_id: userId,
    })
    .select("id")
    .single()

  if (error) throw error

  return created.id
}




  return (
    <>
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
        onClick={() =>
          document.getElementById("import-transactions").click()
        }
      >
        <Upload className="h-4 w-4" />
        Import Transactions (CSV)
      </Button>

      {/* PREVIEW */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl"
            data-loading={loading}
            onEscapeKeyDown={(e) => {
                if (loading) e.preventDefault()
            }}
            onPointerDownOutside={(e) => {
                if (loading) e.preventDefault()
            }}
        >
          <DialogHeader>
            <DialogTitle>
                Import Preview ({rows.length} items)
            </DialogTitle>

            <DialogDescription className="text-sm">
                Review the transactions below before confirming the import.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      {r.spent_at.split("T")[0]}
                    </td>
                    <td className="p-2">{r.title}</td>
                    <td className="p-2">{r.category || "—"}</td>
                    <td className="p-2 capitalize">{r.type}</td>
                    <td className="p-2 text-right">
                      ₱{r.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        {loading && (
        <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
            <span>Importing transactions…</span>
            <span>{progress}%</span>
            </div>

            <div className="h-2 w-full rounded bg-muted overflow-hidden">
            <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
            />
            </div>
        </div>
        )}


          <div className="flex justify-end gap-3 pt-4">
                <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                >
                Cancel
                </Button>

                <Button onClick={handleImport} disabled={loading}>
                {loading ? "Importing…" : "Confirm Import"}
                </Button>

          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* =============================
   NORMALIZE ROW (FINAL)
============================= */
function normalizeRow(row, index) {
  if (!row || Object.values(row).every(v => !String(v || "").trim())) {
    return null
  }

  // helper (case-insensitive headers)
  const get = (...keys) =>
    keys
      .map(k => row[k.toLowerCase()])
      .find(v => v !== undefined && v !== "")

  // TITLE
  const title =
    get("title", "description", "details", "name")

  if (!title) {
    throw new Error(`Row ${index + 1}: Missing title`)
  }

  // AMOUNT
  const amountRaw = get("amount", "value", "total")
  const amount = Number(
    String(amountRaw || "").replace(/[^0-9.-]/g, "")
  )

  if (Number.isNaN(amount)) {
    throw new Error(`Row ${index + 1}: Invalid amount`)
  }

  // DATE
  const rawDate = get("date", "transaction date", "spent_at")

  if (!rawDate) {
    throw new Error(`Row ${index + 1}: Missing date`)
  }

  let date
  if (rawDate.includes("/")) {
    const [m, d, y] = rawDate.split("/")
    date = new Date(`${y}-${m}-${d}`)
  } else {
    date = new Date(rawDate)
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Row ${index + 1}: Invalid date`)
  }

  // TYPE
  const typeRaw = get("type")
  const type =
    String(typeRaw || "").toLowerCase() === "income"
      ? "income"
      : "expense"

  return {
    title: title.trim(),
    amount,
    type,
    category: get("category", "category name")?.trim() || null,
    spent_at: date.toISOString(),
  }
}


/* =============================
   CSV PARSER (BOM SAFE)
============================= */
function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, "").trim()

  const lines = clean.split(/\r?\n/)
  if (lines.length < 2) return []

  // Auto-detect delimiter
  const delimiter = lines[0].includes(";") ? ";" : ","

  const headers = lines
    .shift()
    .split(delimiter)
    .map(h =>
      h
        .trim()
        .replace(/^"|"$/g, "")
        .toLowerCase()
    )

  return lines
    .filter(line => line.trim())
    .map(line => {
      const values = line
        .split(
          delimiter === ","
            ? /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
            : /;(?=(?:(?:[^"]*"){2})*[^"]*$)/
        )
        .map(v => v.replace(/^"|"$/g, "").trim())

      const row = {}
      headers.forEach((h, i) => {
        row[h] = values[i]
      })
      return row
    })
}

