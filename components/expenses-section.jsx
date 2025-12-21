"use client"

import { useState } from "react"
import AddExpenseDialog from "./add-expense-dialog"
import ExpenseTable from "./expense-table"

export default function ExpensesSection() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <AddExpenseDialog onAdded={() => setRefreshKey(k => k + 1)} />
      <ExpenseTable refreshKey={refreshKey} />
    </>
  )
}
