'use client'

import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'
import { useTheme } from '@/components/theme-provider'

interface ChartData {
  name: string
  value: number
  fill: string
}

export function VehicleStatusChart({ data }: { data: ChartData[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const labelColor  = isDark ? '#9ca3af' : '#374151'
  const tooltipBg   = isDark ? '#1f2937' : '#ffffff'
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb'
  const tooltipText = isDark ? '#f9fafb' : '#111827'
  const cursorFill  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 32 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: labelColor, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            color: tooltipText,
          }}
          cursor={{ fill: cursorFill }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={2}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
          <LabelList dataKey="value" position="right" style={{ fill: labelColor, fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
