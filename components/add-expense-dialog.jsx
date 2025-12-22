"use client"

import { useEffect, useState } from "react"
import { addExpense } from "@/lib/expenses"
import { getCategories } from "@/lib/categories"
import { createClient } from "@/lib/supabase/client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

export default function AddExpenseDialog() {
  const supabase = createClient()

  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(today())

  /* ----------------------------------------
     Load categories
  ---------------------------------------- */
  async function loadCategories() {
    const data = await getCategories()
    setCategories(data)
  }


  useEffect(() => {
    let channel

    async function init() {
      await loadCategories()

      channel = supabase
        .channel("categories-for-expenses")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "categories",
          },
          () => {
            loadCategories()
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.target)

    await addExpense({
      title: form.get("title"),
      amount: form.get("amount"),
      spent_at: date,
      category_id: categoryId || null,
    })

    setLoading(false)
    setOpen(false)

    // reset form
    e.target.reset()
    setDate(today())
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) loadCategories() // 🔑 refresh when opened
      }}
    >
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
                <label className="text-sm font-medium">
                Title
                </label>
                <Input
                name="title"
                placeholder="e.g. Grocery shopping"
                autoFocus
                required
                />
            </div>

            {/* Amount */}
            <div className="space-y-1">
                <label className="text-sm font-medium">
                Amount
                </label>
                <Input
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                />
            </div>

            {/* Category */}
            <div className="space-y-1">
                <label className="text-sm font-medium">
                Category
                </label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                    {!categories.length && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                        No categories yet
                    </div>
                    )}
                    {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            {/* Date */}
            <div className="space-y-1">
                <label className="text-sm font-medium">
                Date
                </label>
                <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                />
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save"}
            </Button>
            </form>

      </DialogContent>
    </Dialog>
  )
}

function today() {
  return new Date().toISOString().split("T")[0]
}
