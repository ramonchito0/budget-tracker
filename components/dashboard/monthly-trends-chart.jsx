"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatPeso } from "@/lib/currency"

export default function MonthlyTrendsChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={value => formatPeso(value)} />
        <Bar dataKey="income" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
