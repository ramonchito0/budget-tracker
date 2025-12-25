import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AddTransactionDialog from "@/components/add-transaction-dialog"
import TransactionsTable from "@/components/transactions-table"

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-semibold tracking-tight">
            Transactions
            </h1>
            <p className="text-sm text-muted-foreground">
            View and manage your income and expenses
            </p>
        </div>

        <div className="hidden md:block"><AddTransactionDialog /></div>
        </div>


      <Card>
        <CardHeader className="px-4">
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <TransactionsTable />
        </CardContent>
      </Card>
    </div>
  )
}
