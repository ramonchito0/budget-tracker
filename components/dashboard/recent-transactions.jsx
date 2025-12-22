"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp } from "lucide-react"

const MAX_ITEMS = 10

export default function RecentTransactions() {
  const supabase = createClient()

  const [items, setItems] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    const start = todayStart()
    const end = todayEnd()

    const { data } = await supabase
      .from("expenses")
        .select(`
            id,
            title,
            amount,
            type,
            created_at,
            categories ( name )
        `)
        .order("created_at", { ascending: false })
        .limit(MAX_ITEMS + 1)

    if (!data) {
      setItems([])
      setHasMore(false)
      setLoading(false)
      return
    }

    setItems(data.slice(0, MAX_ITEMS))
    setHasMore(data.length > MAX_ITEMS)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="rounded border p-6">
        <p className="text-sm text-muted-foreground">Loading transactions…</p>
      </div>
    )
  }

  return (
    <div className="rounded border">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Today's latest income and expenses
        </p>
      </div>


      {/* List */}
      <div className="divide-y">
        {!items.length && (
          <div className="p-6 text-sm text-muted-foreground">
            No transactions today
          </div>
        )}

        {items.map(tx => {
          const isIncome = tx.type === "income"

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isIncome
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                )}
                >
                {isIncome ? (
                    <TrendingUp className="h-5 w-5" />
                ) : (
                    <TrendingDown className="h-5 w-5" />
                )}
                </div>


                {/* Details */}
                <div>
                  <p className="font-medium leading-none">
                    {tx.title}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-xs text-muted-foreground">
                      {tx.categories?.name} • {formatTime(tx.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div
                className={cn(
                  "font-semibold",
                  isIncome ? "text-green-600" : "text-red-600"
                )}
              >
                {isIncome ? "+" : "-"}₱{Number(tx.amount).toFixed(2)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {hasMore && (
        <div className="border-t p-4 text-center">
          <Button variant="ghost" size="sm">
            View more
          </Button>
        </div>
      )}
    </div>
  )
}

/* ---------------- helpers ---------------- */

function todayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function todayEnd() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}


function formatTime(dateString) {
  const date = new Date(dateString)

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}
