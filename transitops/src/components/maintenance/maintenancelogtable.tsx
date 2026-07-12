import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { CloseMaintenanceButton } from './close-maintenance-button'
import { format } from 'date-fns'

type MaintenanceLog = {
  id: string
  serviceType: string
  cost: number
  date: Date
  status: 'ACTIVE' | 'COMPLETED'
  notes: string | null
  vehicle: {
    id: string
    nameModel: string
    regNo: string
  }
}

export function MaintenanceLogTable({
  logs
}: {
  logs: MaintenanceLog[]
}) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No maintenance records yet.
        Click "Log Service Record" to add one.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehicle</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>
              <div>
                <p className="font-medium text-foreground">
                  {log.vehicle.nameModel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.vehicle.regNo}
                </p>
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {log.serviceType}
            </TableCell>
            <TableCell className="text-foreground">
              ₹{log.cost.toLocaleString()}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {format(new Date(log.date), 'dd MMM yyyy')}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm max-w-32 truncate">
              {log.notes ?? '—'}
            </TableCell>
            <TableCell>
              <StatusBadge status={log.status} />
            </TableCell>
            <TableCell>
              {log.status === 'ACTIVE' ? (
                <CloseMaintenanceButton
                  maintenanceId={log.id}
                  vehicleName={log.vehicle.nameModel}
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Completed
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}