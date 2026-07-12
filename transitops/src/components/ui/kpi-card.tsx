import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'default' | 'green' | 'blue' | 'orange' | 'red' | 'purple'
  subtitle?: string
}

const colorMap = {
  default: 'text-foreground bg-accent/50',
  green:   'text-green-400 bg-green-500/10',
  blue:    'text-blue-400 bg-blue-500/10',
  orange:  'text-orange-400 bg-orange-500/10',
  red:     'text-red-400 bg-red-500/10',
  purple:  'text-purple-400 bg-purple-500/10',
}

export function KpiCard({ title, value, icon: Icon, color = 'default', subtitle }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            {title}
          </p>
          <div className={cn('p-2 rounded-lg', colorMap[color])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
