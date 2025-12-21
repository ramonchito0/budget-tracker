"use client"

import { useEffect, useState, useTransition } from "react"
import { getExpenses, deleteExpense } from "@/lib/expenses"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import EditExpenseDialog from "./edit-expense-dialog"

export default function ExpenseTable() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [isPending, startTransition] = useTransition()

  const supabase = createClient()

  async function loadExpenses() {
    setLoading(true)
    const data = await getExpenses()
    setExpenses(data)
    setLoading(false)
  }

  useEffect(() => {
    let channel

    async function init() {
      await loadExpenses()

      channel = supabase
        .channel("expenses-ux")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
          },
          () => {
            startTransition(loadExpenses)
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function handleDelete(id) {
    // ✅ OPTIMISTIC UI
    setDeletingId(id)
    setExpenses(prev => prev.filter(e => e.id !== id))

    try {
      await deleteExpense(id)
    } finally {
      setDeletingId(null)
    }
  }

  // ---------- LOADING STATE ----------
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {!expenses.length && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No expenses yet
              </TableCell>
            </TableRow>
          )}

          {expenses.map(exp => (
            <TableRow
              key={exp.id}
              className={deletingId === exp.id ? "opacity-50" : ""}
            >
              <TableCell>{exp.title}</TableCell>
              <TableCell>{exp.category?.name || "—"}</TableCell>
              <TableCell>{exp.spent_at}</TableCell>
              <TableCell className="text-right">
                ₱{Number(exp.amount).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === exp.id || isPending}
                    >
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(exp)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(exp.id)}
                    >
                      {deletingId === exp.id ? "Deleting…" : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* EDIT DIALOG (portal) */}
      {editing && (
        <EditExpenseDialog
          expense={editing}
          open={!!editing}
          onOpenChange={() => setEditing(null)}
        />
      )}
    </div>
  )
}
