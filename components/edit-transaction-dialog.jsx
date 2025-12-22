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

  {/* Description */}
  <div className="space-y-1">
    <label className="text-sm font-medium">
      Title
    </label>
    <Input
      value={title}
      onChange={e => setTitle(e.target.value)}
      placeholder='Optional title'
      required
    />
  </div>

  {/* Amount */}
  <div className="space-y-1">
    <label className="text-sm font-medium">
      Amount
    </label>
    <Input
      type="number"
      step="0.01"
      value={amount}
      placeholder="0.00"
      onChange={e => setAmount(e.target.value)}
      required
    />
  </div>

  

  {/* Submit */}
  <Button type="submit" disabled={loading}>
    {loading ? "Saving…" : "Update"}
  </Button>
</form>

      </DialogContent>
    </Dialog>
  )
}
