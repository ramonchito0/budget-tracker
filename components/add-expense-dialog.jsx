"use client"

import { useEffect, useState } from "react"
import { addExpense } from "@/lib/expenses"
import { getCategories } from "@/lib/categories"
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
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(today())



  useEffect(() => {
    getCategories().then(setCategories)
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
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="title" placeholder="Title" required />
          <Input name="amount" type="number" required />

          {/* Category dropdown */}
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

            <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            />

            <Button disabled={loading}>
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
