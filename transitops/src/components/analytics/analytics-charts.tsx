'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface CostlyVehicle {
  name: string
  cost: number
}

const TOOLTIP_STYLE = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#f9fafb',
  fontSize: '13px',
}

const CURSOR_STYLE = { fill: 'rgba(255,255,255,0.04)' }

export function MonthlyRevenueChart({ data }: { data: MonthlyRevenue[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <XAxis
          dataKey="month"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={CURSOR_STYLE}
          formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
        />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CostlyVehiclesChart({ data }: { data: CostlyVehicle[] }) {
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis
          type="number"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={CURSOR_STYLE}
          formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Total Cost']}
        />
        <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
