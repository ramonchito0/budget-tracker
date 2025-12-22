"use client"

import { useEffect, useState, useTransition } from "react"
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/categories"
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export default function CategoryManager() {
  const supabase = createClient()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState("")
  const [type, setType] = useState("expense")
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()

  /* ----------------------------------------
     Load categories
  ---------------------------------------- */
  async function load() {
    setLoading(true)
    const data = await getCategories()
    setCategories(data)
    setLoading(false)
  }

  /* ----------------------------------------
     Realtime (sync only, NOT UX)
  ---------------------------------------- */
  useEffect(() => {
    let channel

    async function init() {
      await load()

      channel = supabase
        .channel("categories-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "categories",
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
     Save (add / edit)
  ---------------------------------------- */
  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim() || saving) return

    setSaving(true)
    setError("")

    try {
      if (editing) {
        // optimistic edit
        setCategories(prev =>
          prev.map(c =>
            c.id === editing.id ? { ...c, name, type } : c
          )
        )

        await updateCategory(editing.id, name, type)
      } else {
        // optimistic add
        const tempId = crypto.randomUUID()
        setCategories(prev => [
          { id: tempId, name, type },
          ...prev,
        ])

        await addCategory(name, type)
      }

      setName("")
      setType("expense")
      setEditing(null)
      setOpen(false)
    } catch (err) {
      await load()
      setError(err.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  /* ----------------------------------------
     Delete (NO optimistic UI)
  ---------------------------------------- */
async function handleDelete(id) {
  setDeletingId(id)

  try {
    await deleteCategory(id)

    setCategories(prev => prev.filter(c => c.id !== id))
  } catch (err) {
    alert(err.message)
  } finally {
    setDeletingId(null)
  }
}


  /* ----------------------------------------
     Loader
  ---------------------------------------- */
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
    <div className="space-y-4">
      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              setEditing(null)
              setName("")
              setType("expense")
              setError("")
            }}
          >
            Add Category
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Type selector */}
            <div className="space-y-1">
            <label className="text-sm font-medium">
                Category Type
            </label>

            <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                <SelectValue placeholder="Select type" />
                </SelectTrigger>

                <SelectContent>
                <SelectItem value="expense">
                    Expense
                </SelectItem>
                <SelectItem value="income">
                    Income
                </SelectItem>
                </SelectContent>
            </Select>
            </div>

            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Category name"
              autoFocus
              required
            />

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editing
                ? "Update"
                : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Categories Table */}
      <div className="rounded border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {!categories.length && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  No categories yet
                </TableCell>
              </TableRow>
            )}

            {categories.map(cat => (
              <TableRow
                key={cat.id}
                className={deletingId === cat.id ? "opacity-50" : ""}
              >
                <TableCell>{cat.name}</TableCell>
                <TableCell>
                  <span
                    className={
                      cat.type === "income"
                        ? "text-green-600 font-medium"
                        : "text-red-600"
                    }
                  >
                    {cat.type === "income"
                      ? "Income"
                      : "Expense"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === cat.id}
                      >
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(cat)
                          setName(cat.name)
                          setType(cat.type)
                          setOpen(true)
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        disabled={deletingId === cat.id}
                        onSelect={() => handleDelete(cat.id)}
                      >
                        {deletingId === cat.id
                          ? "Deleting…"
                          : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
