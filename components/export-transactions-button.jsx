"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportTransactionsCSV } from "@/lib/export-transactions"

export default function ExportTransactionsButton() {
  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={exportTransactionsCSV}
    >
      <Download className="h-4 w-4" />
      Export Transactions (CSV)
    </Button>
  )
}
