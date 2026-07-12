'use client'

import { useState, useTransition } from 'react'
import { Role } from '@prisma/client'
import { updateEmployeeRole, toggleEmployeeStatus } from '@/app/actions/admin'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Lock, Unlock } from 'lucide-react'

const roleLabels: Record<Role, string> = {
  ADMIN:            'Admin',
  FLEET_MANAGER:    'Fleet Manager',
  DISPATCHER:       'Dispatcher',
  SAFETY_OFFICER:   'Safety Officer',
  FINANCIAL_ANALYST:'Financial Analyst',
}

type Employee = {
  id: string
  name: string
  email: string
  role: Role
  failedAttempts: number
  lockedUntil: Date | null
  createdAt: Date
}

export function EmployeeTable({ employees }: { employees: Employee[] }) {
  const [isPending, startTransition] = useTransition()
  const [changingId, setChangingId] = useState<string | null>(null)

  const isLocked = (emp: Employee) =>
    emp.lockedUntil && new Date(emp.lockedUntil) > new Date()

  async function handleRoleChange(userId: string, newRole: Role) {
    setChangingId(userId)
    startTransition(async () => {
      const result = await updateEmployeeRole(userId, newRole)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Role updated successfully')
      }
      setChangingId(null)
    })
  }

  async function handleToggleStatus(userId: string, currentlyLocked: boolean) {
    startTransition(async () => {
      await toggleEmployeeStatus(userId)
      toast.success(currentlyLocked ? 'Account unlocked' : 'Account locked')
    })
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No employees yet. Click "+ Add Employee" to create the first account.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((emp) => {
          const locked = isLocked(emp)
          return (
            <TableRow key={emp.id}>
              <TableCell className="font-medium text-foreground">
                {emp.name}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {emp.email}
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={emp.role}
                  onValueChange={(val) => handleRoleChange(emp.id, val as Role)}
                  disabled={isPending && changingId === emp.id}
                >
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                  locked
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-green-500/20 text-green-400 border-green-500/30'
                }`}>
                  {locked ? '🔒 Locked' : '✓ Active'}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(emp.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(emp.id, !!locked)}
                  disabled={isPending}
                  className="h-8 px-2 text-xs"
                >
                  {locked
                    ? <><Unlock className="h-3 w-3 mr-1" /> Unlock</>
                    : <><Lock className="h-3 w-3 mr-1" /> Lock</>
                  }
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
