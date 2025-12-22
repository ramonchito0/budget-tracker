"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { getCategories } from "@/lib/categories"
import { getExpenses, deleteExpense } from "@/lib/expenses"
import EditTransactionDialog from "@/components/edit-transaction-dialog"

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export default function TransactionsTable() {
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [type, setType] = useState("all")
  const [categoryId, setCategoryId] = useState("all")
  const [deletingId, setDeletingId] = useState(null)
  const [editing, setEditing] = useState(null)

  /* ----------------------------------------
     Load transactions
  ---------------------------------------- */
  async function load() {
    const data = await getExpenses()
    setTransactions(data)
  }

  /* ----------------------------------------
     Initial load + realtime
  ---------------------------------------- */
  useEffect(() => {
    let channel

    async function init() {
      const cats = await getCategories()
      setCategories(cats)

      await load()

      channel = supabase
        .channel("transactions-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
          },
          () => {
            startTransition(load)
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  /* ----------------------------------------
     Filters
  ---------------------------------------- */
  const filtered = transactions.filter(tx => {
    if (type !== "all" && tx.type !== type) return false
    if (categoryId !== "all" && tx.category_id !== categoryId) return false
    return true
  })

  /* ----------------------------------------
     Delete (optimistic)
  ---------------------------------------- */
  async function handleDelete(id) {
    setDeletingId(id)
    setTransactions(prev => prev.filter(t => t.id !== id))

    try {
      await deleteExpense(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {!filtered.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            )}

            {filtered.map(tx => (
              <TableRow
                key={tx.id}
                className={deletingId === tx.id ? "opacity-50" : ""}
              >
                <TableCell>{tx.spent_at}</TableCell>
                <TableCell>{tx.title}</TableCell>
                <TableCell>{tx.category?.name || "—"}</TableCell>
                <TableCell>
                  <span
                    className={
                      tx.type === "income"
                        ? "text-green-600 font-medium"
                        : "text-red-600"
                    }
                  >
                    {tx.type === "income" ? "Income" : "Expense"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  ₱{Number(tx.amount).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === tx.id}
                      >
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(tx)}>
                        Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="text-red-600"
                        onSelect={() => handleDelete(tx.id)}
                    >
                        Delete
                    </DropdownMenuItem>
                    </DropdownMenuContent>

                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {editing && (
        <EditTransactionDialog
            transaction={editing}
            open={!!editing}
            onOpenChange={() => setEditing(null)}
        />
        )}
      </div>
    </div>
  )
}
