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

export default function ImportTransactionsButton() {
  const supabase = createClient()

  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

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
          const n = normalizeRow(row, index)
          if (n) normalized.push(n)
        } catch {
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

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Not authenticated")
    }

    const inserts = []

    for (const row of rows) {
      const category_id = row.category
        ? await resolveCategory(row.category, row.type)
        : null

      inserts.push({
        user_id: user.id,          // ✅ REQUIRED
        title: row.title,
        amount: row.amount,
        type: row.type,
        category_id,
        spent_at: row.spent_at,
      })
    }

    const { error } = await supabase
      .from("expenses")
      .insert(inserts)

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    toast.success(`Imported ${inserts.length} transactions`)
    setOpen(false)
    setRows([])
  } catch (err) {
    console.error(err)
    toast.error(err.message || "Import failed")
  } finally {
    setLoading(false)
  }
}



  /* =============================
     CATEGORY RESOLVER
  ============================= */
async function resolveCategory(name, type) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("name", name)
    .eq("type", type)
    .eq("user_id", user.id)
    .single()

  if (data) return data.id

  const { data: created, error } = await supabase
    .from("categories")
    .insert({
      name,
      type,
      user_id: user.id,
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Import Preview ({rows.length} items)
            </DialogTitle>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
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
  // Skip empty rows
  if (!row || Object.values(row).every(v => !String(v || "").trim())) {
    return null
  }

  // TITLE (NOT CATEGORY)
  const title =
    row.Title?.trim() ||
    row.Description?.trim() ||
    row.Details?.trim()

  if (!title) {
    throw new Error(`Row ${index + 1}: Missing title`)
  }

  // AMOUNT
  const amount = Number(
    String(row.Amount || "")
      .replace(/[^0-9.-]/g, "")
  )

  if (Number.isNaN(amount)) {
    throw new Error(`Row ${index + 1}: Invalid amount`)
  }

  // DATE (handles BOM + Excel)
  const rawDate =
    row.Date ||
    row["﻿Date"] || // BOM-safe
    row["Transaction Date"]

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
  const type =
    String(row.Type || "")
      .toLowerCase() === "income"
      ? "income"
      : "expense"

  return {
    title,
    amount,
    type,
    category: row.Category?.trim() || null,
    spent_at: date.toISOString(),
  }
}

/* =============================
   CSV PARSER (BOM SAFE)
============================= */
function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, "") // remove BOM
  const lines = clean.trim().split(/\r?\n/)

  const headers = lines
    .shift()
    .split(",")
    .map(h => h.trim().replace(/^"|"$/g, ""))

  return lines.map(line => {
    const values = line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map(v => v.replace(/^"|"$/g, "").trim())

    const row = {}
    headers.forEach((h, i) => {
      row[h] = values[i]
    })
    return row
  })
}
