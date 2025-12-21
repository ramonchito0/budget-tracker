"use client"

import { useEffect, useState } from "react"
import { updateExpense } from "@/lib/expenses"
import { getCategories } from "@/lib/categories"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export default function EditExpenseDialog({ expense, open, onOpenChange }) {
  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState(expense.title)
  const [amount, setAmount] = useState(expense.amount)
  const [date, setDate] = useState(expense.spent_at)
  const [categoryId, setCategoryId] = useState(expense.category?.id || "")

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  async function handleSave() {
    await updateExpense(expense.id, {
      title,
      amount,
      spent_at: date,
      category_id: categoryId || null,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} />
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />

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

          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />

          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
