import AddTransactionDialog from "@/components/add-transaction-dialog"
import RecentTransactions from "@/components/dashboard/recent-transactions"
import MonthlyTrendsChart from "@/components/dashboard/monthly-trends-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatPesoCompact } from "@/lib/currency"
import { getMonthlyTrends } from "@/lib/dashboard/monthly-trends"
import { createClient } from "@/lib/supabase/server"
import SpendingByCategoryChart from "@/components/dashboard/spending-by-category-chart"
import { getSpendingByCategoryThisMonth } from "@/lib/dashboard/spending-by-category"
import { getMonthlyKPI } from "@/lib/dashboard/monthly-kpis"
import { getSavingsMetrics } from "@/lib/dashboard/savings-metrics"

export default async function DashboardPage() {
  // 🔧 temporary static values (we’ll replace with real data)
  const totalIncome = 3500
  const totalExpenses = 2000
  const balance = totalIncome - totalExpenses
  const savingsRate = ((balance / totalIncome) * 100).toFixed(1)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser();

const { data: expenses = [] } = await supabase
  .from("expenses")
  .select(`
    amount,
    type,
    spent_at,
    category:categories (
      name
    )
  `)
  .eq("user_id", user.id)
  .order("spent_at", { ascending: true })


  const monthlyTrends = getMonthlyTrends(expenses || [])
  const spendingByCategory = getSpendingByCategoryThisMonth(expenses || [])

  const incomeKPI = getMonthlyKPI(expenses, "income")
  const expenseKPI = getMonthlyKPI(expenses, "expense")

  const savings = getSavingsMetrics(
    incomeKPI.total,
    expenseKPI.total
)


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
        <div className="hidden md:block"><AddTransactionDialog /></div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg xl:text-2xl font-bold text-green-600">
              {formatPesoCompact(savings.balance)}
            </div>

            <p className="text-xs text-muted-foreground">
              {savings.savingsRate === null ? (
                "— from income"
              ) : (
                <>
                  {savings.savingsRate > 0 ? "+" : ""}
                  {savings.savingsRate.toFixed(1)}% from income
                </>
              )}
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg xl:text-2xl font-bold text-green-600">
              {formatPesoCompact(incomeKPI.total)}
            </div>

            <p className="text-xs text-muted-foreground">
              {incomeKPI.percentChange === null ? (
                "— from last month"
              ) : (
                <>
                  {incomeKPI.percentChange > 0 ? "+" : ""}
                  {incomeKPI.percentChange.toFixed(1)}% from last month
                </>
              )}
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg xl:text-2xl font-bold text-red-600">
              {formatPesoCompact(expenseKPI.total)}
            </div>

            <p className="text-xs text-muted-foreground">
              {expenseKPI.percentChange === null ? (
                "— from last month"
              ) : (
                <>
                  {expenseKPI.percentChange > 0 ? "+" : ""}
                  {expenseKPI.percentChange.toFixed(1)}% from last month
                </>
              )}
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg xl:text-2xl font-bold">
              {savings.savingsRate === null ? (
                "—"
              ) : (
                `${savings.savingsRate.toFixed(1)}%`
              )}
            </div>

            {/* <p className="text-xs text-muted-foreground">
              Target: 20%
            </p> */}
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your expense breakdown for this month
                </p>
              </CardHeader>
              <CardContent>
                <SpendingByCategoryChart data={spendingByCategory} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Income vs Expenses over time
                </p>
              </CardHeader>
              <CardContent className="h-[320px]">
                <MonthlyTrendsChart data={monthlyTrends} />
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
