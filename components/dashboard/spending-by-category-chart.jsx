"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatPeso } from "@/lib/currency"

const COLORS = [
  "#14b8a6", // teal
  "#f97316", // orange
  "#334155", // slate
  "#eab308", // yellow
  "#6366f1", // indigo
  "#ec4899", // pink
]

export default function SpendingByCategoryChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No expenses this month
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={value => formatPeso(value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Breakdown */}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor:
                    COLORS[index % COLORS.length],
                }}
              />
              <span>{item.name}</span>
            </div>

            <span className="font-medium">
              {formatPeso(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
