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
import { Checkbox } from "@/components/ui/checkbox"
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
import { formatPeso } from "@/lib/currency"

import { toast } from "sonner"
import { formatTime } from "@/lib/date-time"

const PAGE_SIZE = 20

export default function TransactionsTable() {
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])

  const [type, setType] = useState("all")
  const [categoryId, setCategoryId] = useState("all")

  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])

  const [deletingId, setDeletingId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(null)

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [dateFilter, setDateFilter] = useState("all")


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
    // Type
    if (type !== "all" && tx.type !== type) return false

    // Category
    if (categoryId !== "all" && tx.category_id !== categoryId) return false

    // Preset date filters
    if (dateFilter === "today" && !isToday(tx.spent_at)) return false
    if (dateFilter === "week" && !isThisWeek(tx.spent_at)) return false
    if (dateFilter === "month" && !isThisMonth(tx.spent_at)) return false

    // Manual date range ONLY when preset = all
    if (dateFilter === "all") {
      const spentAt = new Date(tx.spent_at)

      if (fromDate) {
        const from = new Date(fromDate)
        if (spentAt < from) return false
      }

      if (toDate) {
        const to = new Date(toDate)
        to.setHours(23, 59, 59, 999)
        if (spentAt > to) return false
      }
    }

    return true
  })



  const totalAmount = filtered.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  )

const filteredCategories =
  type === "all"
    ? []
    : categories.filter(cat => cat.type === type)


  /* ----------------------------------------
     Pagination (AFTER filters)
  ---------------------------------------- */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
    setSelected([])
  }, [type, categoryId, dateFilter, fromDate, toDate])

  /* ----------------------------------------
     Selection helpers
  ---------------------------------------- */
  function toggleSelect(id) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (selected.length === paginated.length) {
      setSelected([])
    } else {
      setSelected(paginated.map(tx => tx.id))
    }
  }

  /* ----------------------------------------
     Single delete (optimistic)
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

  /* ----------------------------------------
     Bulk delete
  ---------------------------------------- */
async function handleBulkDelete() {
  if (!selected.length) return

  setDeleting(true)

  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .in("id", selected)

    if (error) throw error

    // Optimistic UI update
    setTransactions(prev =>
      prev.filter(tx => !selected.includes(tx.id))
    )

    toast.success(
      `${selected.length} transaction${selected.length > 1 ? "s" : ""} deleted`
    )

    setSelected([])
  } catch (err) {
    console.error(err)
    toast.error("Failed to delete transactions")
  } finally {
    setDeleting(false)
  }
}

function isToday(date) {
  const d = new Date(date)
  const t = new Date()

  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  )
}

function isThisWeek(date) {
  const d = new Date(date)
  const t = new Date()

  const start = new Date(t)
  start.setDate(t.getDate() - t.getDay())
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return d >= start && d <= end
}

function isThisMonth(date) {
  const d = new Date(date)
  const t = new Date()

  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth()
  )
}



  return (
    <div className="space-y-4">
<div className="flex flex-wrap items-center justify-between gap-4">
  {/* Left: Title + Filters */}
  <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {/* TYPE */}
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

        {/* CATEGORY */}
        <Select
          value={categoryId}
          onValueChange={setCategoryId}
          disabled={type === "all"}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue
              placeholder={
                type === "all"
                  ? "Select type first"
                  : "Category"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filteredCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

<Select
  value={dateFilter}
  onValueChange={value => {
    setDateFilter(value)
    setFromDate("")
    setToDate("")
  }}
>

          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>


        {/* FROM DATE */}
        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          disabled={dateFilter !== "all"}
          className="h-10 rounded-md border px-3 text-sm"
        />

        {/* TO DATE */}
        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          disabled={dateFilter !== "all"}
          className="h-10 rounded-md border px-3 text-sm"
        />
        
        {(fromDate || toDate) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFromDate("")
              setToDate("")
            }}
          >
            Clear dates
          </Button>
        )}
      </div>
  </div>

  {/* Right: Total */}
  <div className="2xl:text-right">
    <p className="text-sm text-muted-foreground">
      Total
    </p>
    <p className="text-xl font-semibold">
      {formatPeso(totalAmount)}
    </p>
  </div>
</div>


      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={deleting}
            onClick={handleBulkDelete}
          >
            {deleting ? "Deleting…" : `Delete (${selected.length})`}
          </Button>


        <Button
          variant="outline"
          disabled={deleting}
          onClick={() => setSelected([])}
        >
          Cancel
        </Button>

        </div>
      )}


      {/* Table */}
      <div className="rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
<Checkbox
  disabled={deleting}
  checked={
    paginated.length > 0 &&
    selected.length === paginated.length
  }
  onCheckedChange={toggleSelectAll}
/>

              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:block">Title</TableHead>
              <TableHead className="hidden md:block">Category</TableHead>
              <TableHead className="hidden md:block">Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {!paginated.length && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            )}

            {paginated.map(tx => (
              <TableRow
                key={tx.id}
                className={deletingId === tx.id ? "opacity-50" : ""}
              >
                <TableCell>
<Checkbox
  disabled={deleting}
  checked={selected.includes(tx.id)}
  onCheckedChange={() => toggleSelect(tx.id)}
/>

                </TableCell>
                <TableCell>
                  {new Date(tx.spent_at).toLocaleDateString()}<br/>
                  <span className="text-xs text-muted-foreground">{formatTime(tx.created_at)}</span>
                </TableCell>
                <TableCell  className="hidden md:block">{tx.title}</TableCell>
                <TableCell className="hidden md:block">{tx.category?.name || "—"}</TableCell>
                <TableCell className="hidden md:block">
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
                  {formatPeso(tx.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <EditTransactionDialog
          transaction={editing}
          open={!!editing}
          onOpenChange={() => setEditing(null)}
        />
      )}
    </div>
  )
}
