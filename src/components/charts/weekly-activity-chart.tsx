'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type WeeklyActivityChartProps = {
  data: Array<{ date: string; workouts: number }>
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const chartData = data.map(day => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    workouts: day.workouts
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          stroke="currentColor"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          stroke="currentColor"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--popover-foreground))'
          }}
        />
        <Bar
          dataKey="workouts"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
