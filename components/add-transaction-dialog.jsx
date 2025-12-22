"use client"

import { useEffect, useState } from "react"
import { addExpense } from "@/lib/expenses"
import { getCategories } from "@/lib/categories"
import { toast } from "sonner"

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

export default function AddTransactionDialog() {

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [type, setType] = useState("expense")
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState("")
  const [date, setDate] = useState(today())

  /* ----------------------------------------
     Load categories (filtered by type)
  ---------------------------------------- */
  async function loadCategories(selectedType) {
    const data = await getCategories()
    setCategories(data.filter(c => c.type === selectedType))
  }

useEffect(() => {
  if (!open) return

  async function init() {
    await loadCategories(type)

    const last = getLastCategory(type)

    setCategoryId(
      categories.some(c => c.id === last) ? last : ""
    )
  }

  init()
}, [open, type])



  /* ----------------------------------------
     Submit
  ---------------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    const form = new FormData(e.target)

    try {
      await addExpense({
        title: form.get("title"),
        amount: form.get("amount"),
        spent_at: date,
        type,
        category_id: categoryId || null,
      })

      if (categoryId) {
        setLastCategory(type, categoryId)
      }

      toast.success("Transaction added")
      setOpen(false)
      e.target.reset()
      setDate(today())
      setCategoryId("")
    } catch {
      toast.error("Failed to add transaction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

<form onSubmit={handleSubmit} className="space-y-4">

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

  {/* Type */}
  <div className="space-y-1">
    <label className="text-sm font-medium">
      Transaction Type
    </label>
    <Select value={type} onValueChange={setType}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="expense">Expense</SelectItem>
        <SelectItem value="income">Income</SelectItem>
      </SelectContent>
    </Select>
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
            No categories available
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


const STORAGE_KEY = "last-category-by-type"

function getLastCategory(type) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    return data[type] || ""
  } catch {
    return ""
  }
}

function setLastCategory(type, categoryId) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    data[type] = categoryId
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}
