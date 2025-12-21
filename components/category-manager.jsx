"use client"

import { useEffect, useState } from "react"
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/categories"
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

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState("")
  const [editing, setEditing] = useState(null)

  async function load() {
    setCategories(await getCategories())
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave() {
    if (!name.trim()) return

    if (editing) {
      await updateCategory(editing.id, name)
    } else {
      await addCategory(name)
    }

    setName("")
    setEditing(null)
    load()
  }

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Add Category</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Category name"
          />

          <Button onClick={handleSave}>
            {editing ? "Update" : "Save"}
          </Button>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {categories.map(cat => (
              <TableRow key={cat.id}>
                <TableCell>{cat.name}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">•••</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(cat)
                          setName(cat.name)
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          deleteCategory(cat.id)
                          load()
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {!categories.length && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-6">
                  No categories yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
