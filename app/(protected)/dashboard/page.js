import AddTransactionDialog from "@/components/add-transaction-dialog"
import RecentTransactions from "@/components/dashboard/recent-transactions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatPeso } from "@/lib/currency"
import { createClient } from "@/lib/supabase/client"

export default async function DashboardPage() {
  // 🔧 temporary static values (we’ll replace with real data)
  const totalIncome = 3500
  const totalExpenses = 2000
  const balance = totalIncome - totalExpenses
  const savingsRate = ((balance / totalIncome) * 100).toFixed(1)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.email}
          </p>
        </div>

        {/* Client component */}
        <AddTransactionDialog />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPeso(balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{savingsRate}% from income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPeso(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatPeso(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savingsRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 20%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your expense breakdown for this month
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[320px] text-muted-foreground">
                {/* Chart placeholder */}
                Chart goes here
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Income vs Expenses over time
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[320px] text-muted-foreground">
                {/* Chart placeholder */}
                Chart goes here
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions">
          <div className="text-sm bg-white">
              {/* other cards */}
              <RecentTransactions />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
