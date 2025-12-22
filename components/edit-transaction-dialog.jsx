"use client"

import { useEffect, useState } from "react"
import { updateExpense } from "@/lib/expenses"
import { getCategories } from "@/lib/categories"
import { toast } from "sonner"

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

export default function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}) {
  const [loading, setLoading] = useState(false)

  const [type, setType] = useState(transaction.type)
  const [title, setTitle] = useState(transaction.title)
  const [amount, setAmount] = useState(transaction.amount)
  const [date, setDate] = useState(transaction.spent_at)
  const [categoryId, setCategoryId] = useState(transaction.category_id)
  const [categories, setCategories] = useState([])

  /* ----------------------------------------
     Load categories by type
  ---------------------------------------- */
  useEffect(() => {
    getCategories().then(data => {
      setCategories(data.filter(c => c.type === type))
    })
  }, [type])

  /* ----------------------------------------
     Submit
  ---------------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      await updateExpense(transaction.id, {
        title,
        amount,
        spent_at: date,
        category_id: categoryId || null,
        type,
      })

      toast.success("Transaction updated")
      onOpenChange(false)
    } catch {
      toast.error("Failed to update transaction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
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

          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Update"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
