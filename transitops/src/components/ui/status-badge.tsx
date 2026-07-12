import { cn } from '@/lib/utils'

type Status =
  | 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
  | 'SUSPENDED' | 'OFF_DUTY'
  | 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
  | 'ACTIVE'

const config: Record<Status, { label: string; className: string }> = {
  // Vehicle
  AVAILABLE:  { label: 'Available',  className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ON_TRIP:    { label: 'On Trip',    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  IN_SHOP:    { label: 'In Shop',    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  RETIRED:    { label: 'Retired',    className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  // Driver
  SUSPENDED:  { label: 'Suspended',  className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  OFF_DUTY:   { label: 'Off Duty',   className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  // Trip
  DRAFT:      { label: 'Draft',      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  DISPATCHED: { label: 'Dispatched', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  COMPLETED:  { label: 'Completed',  className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  CANCELLED:  { label: 'Cancelled',  className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  // Maintenance
  ACTIVE:     { label: 'Active',     className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status] ?? {
    label: status,
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      className
    )}>
      {label}
    </span>
  )
}
