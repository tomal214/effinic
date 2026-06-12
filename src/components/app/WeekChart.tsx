'use client'

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type WeekChartPoint = {
  weekLabel: string
  completionRate: number
  incidentCount: number
}

export default function WeekChart({ data }: { data: WeekChartPoint[] }) {
  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No report data for this period.
      </p>
    )
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="rate"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            yAxisId="incidents"
            orientation="right"
            allowDecimals={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'completionRate') return [`${value}%`, 'Completion']
              return [value, 'Incidents']
            }}
          />
          <Legend />
          <Bar
            yAxisId="incidents"
            dataKey="incidentCount"
            name="Incidents"
            fill="oklch(0.72 0.12 55)"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="completionRate"
            name="Completion %"
            stroke="oklch(0.58 0.14 175)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
