'use client'

import { MaintenanceLog, MaintenanceStatus, Vehicle } from '@prisma/client'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { CloseMaintenanceButton } from './close-maintenance-button'
import { format } from 'date-fns'
import { Wrench } from 'lucide-react'

type LogWithVehicle = MaintenanceLog & { vehicle: Vehicle }

export function MaintenanceLogTable({
  logs,
  canEdit,
}: {
  logs: LogWithVehicle[]
  canEdit: boolean
}) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Wrench className="h-10 w-10 opacity-20" />
        <p>No maintenance records yet.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehicle</TableHead>
          <TableHead>Service Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Cost (₹)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Notes</TableHead>
          {canEdit && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-medium text-foreground">
              <div>{log.vehicle.nameModel}</div>
              <div className="text-xs text-muted-foreground">{log.vehicle.regNo}</div>
            </TableCell>
            <TableCell>{log.serviceType}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {format(new Date(log.date), 'dd MMM yyyy')}
            </TableCell>
            <TableCell className="text-right font-medium">
              {log.cost.toLocaleString('en-IN')}
            </TableCell>
            <TableCell>
              <StatusBadge status={log.status} />
            </TableCell>
            <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
              {log.notes ?? '—'}
            </TableCell>
            {canEdit && (
              <TableCell>
                {log.status === MaintenanceStatus.ACTIVE ? (
                  <CloseMaintenanceButton maintenanceId={log.id} />
                ) : (
                  <span className="text-xs text-muted-foreground">Closed</span>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
