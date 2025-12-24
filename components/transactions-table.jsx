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
import { formatTime } from "@/lib/date-time"
import { toast } from "sonner"
import { MoreHorizontal, Plus, Minus } from "lucide-react"

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
     Load data
  ---------------------------------------- */
  async function load() {
    const data = await getExpenses()
    setTransactions(data || [])
  }

  /* ----------------------------------------
     Init + realtime
  ---------------------------------------- */
  useEffect(() => {
    let channel

    async function init() {
      setCategories(await getCategories())
      await load()

      channel = supabase
        .channel("transactions-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "expenses" },
          () => startTransition(load)
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  /* ----------------------------------------
     Reset category when type changes
  ---------------------------------------- */
  useEffect(() => {
    setCategoryId("all")
  }, [type])

  /* ----------------------------------------
     Filters
  ---------------------------------------- */
  const filtered = transactions.filter(tx => {
    // Type
    if (type !== "all" && tx.type !== type) return false

    // Category (FIXED string vs number issue)
    if (
      categoryId !== "all" &&
      String(tx.category_id) !== String(categoryId)
    )
      return false

    const spentAt = new Date(tx.spent_at)

    // Preset date filters
    if (dateFilter === "today" && !isToday(spentAt)) return false
    if (dateFilter === "week" && !isThisWeek(spentAt)) return false
    if (dateFilter === "month" && !isThisMonth(spentAt)) return false

    // Manual range (only when preset = all)
    if (dateFilter === "all") {
      if (fromDate && spentAt < new Date(fromDate)) return false
      if (toDate) {
        const to = new Date(toDate)
        to.setHours(23, 59, 59, 999)
        if (spentAt > to) return false
      }
    }

    return true
  })

  /* ----------------------------------------
     Totals (BASED ON FILTERED)
  ---------------------------------------- */
  const totalIncome = filtered
    .filter(tx => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)

  const totalExpense = filtered
    .filter(tx => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)

  /* ----------------------------------------
     Categories per type
  ---------------------------------------- */
  const filteredCategories =
    type === "all" ? [] : categories.filter(cat => cat.type === type)

  /* ----------------------------------------
     Pagination (AFTER filters)
  ---------------------------------------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)

  // FIX: page overflow after filtering / deleting
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [filtered.length])

  // Reset page & selection on filter change
  useEffect(() => {
    setPage(1)
    setSelected([])
  }, [type, categoryId, dateFilter, fromDate, toDate])

  /* ----------------------------------------
     Selection helpers
  ---------------------------------------- */
  function toggleSelect(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    setSelected(
      selected.length === paginated.length ? [] : paginated.map(tx => tx.id)
    )
  }

  /* ----------------------------------------
     Single delete
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
      await supabase.from("expenses").delete().in("id", selected)

      setTransactions(prev =>
        prev.filter(tx => !selected.includes(tx.id))
      )

      toast.success(`${selected.length} transaction(s) deleted`)
      setSelected([])
    } catch {
      toast.error("Failed to delete transactions")
    } finally {
      setDeleting(false)
    }
  }

  /* ----------------------------------------
     Date helpers
  ---------------------------------------- */
  function isToday(d) {
    const t = new Date()
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    )
  }

  function isThisWeek(d) {
    const t = new Date()
    const start = new Date(t)
    start.setDate(t.getDate() - t.getDay())
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return d >= start && d <= end
  }

  function isThisMonth(d) {
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth()
  }

  /* ----------------------------------------
     Render
  ---------------------------------------- */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-4">
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

          <Select
            value={categoryId}
            onValueChange={setCategoryId}
            disabled={type === "all"}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {filteredCategories.map(cat => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dateFilter}
            onValueChange={v => {
              setDateFilter(v)
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

          {dateFilter === "all" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="h-10 rounded-md border px-3 text-sm"
              />
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="h-10 rounded-md border px-3 text-sm"
              />
            </>
          )}
        </div>

        {/* Totals */}
        <div className="flex gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-lg font-semibold text-green-600">
              {formatPeso(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-lg font-semibold text-red-600">
              {formatPeso(totalExpense)}
            </p>
          </div>
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
                  checked={
                    paginated.length > 0 &&
                    selected.length === paginated.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {!paginated.length && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            )}

            {paginated.map(tx => (
              <TableRow key={tx.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(tx.id)}
                    onCheckedChange={() => toggleSelect(tx.id)}
                  />
                </TableCell>

                <TableCell>
                  <p className="font-medium">{tx.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.category?.name} •{" "}
                    {new Date(tx.spent_at).toLocaleDateString()}
                  </p>
                </TableCell>

                <TableCell className="text-right">
                  <div
                    className={`flex justify-end items-center gap-1 font-medium ${
                      tx.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <Plus className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {formatPeso(tx.amount)}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
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

      {editing && (
        <EditTransactionDialog
          transaction={editing}
          open
          onOpenChange={() => setEditing(null)}
        />
      )}
    </div>
  )
}
