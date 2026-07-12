import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/ui/page-header'
import { getEmployees } from '@/app/actions/admin'
import { EmployeeTable } from '@/components/admin/employee-table'
import { CreateEmployeeDialog } from '@/components/admin/create-employee-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, UserCheck, UserX } from 'lucide-react'

export default async function AdminPage() {
  const session = await auth()
  const role = (session?.user as any)?.role

  // Hard guard — non-admins who somehow reach this page get redirected
  if (role !== 'ADMIN') redirect('/dashboard')

  const employees = await getEmployees()

  const activeCount   = employees.filter(e => !e.lockedUntil || new Date(e.lockedUntil) < new Date()).length
  const lockedCount   = employees.filter(e => e.lockedUntil && new Date(e.lockedUntil) > new Date()).length
  const roleBreakdown = employees.reduce((acc, e) => {
    acc[e.role] = (acc[e.role] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Admin Panel" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        <PageHeader
          title="Employee Management"
          description="Create accounts, assign roles, and manage access"
          action={<CreateEmployeeDialog />}
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
                <p className="text-xs text-muted-foreground">Total Employees</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <UserX className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{lockedCount}</p>
                <p className="text-xs text-muted-foreground">Locked</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Object.keys(roleBreakdown).length}
                </p>
                <p className="text-xs text-muted-foreground">Roles Assigned</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RBAC Reference Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Access Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Role</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Fleet</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Drivers</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Trips</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Fuel/Exp</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { role: 'Fleet Manager',     fleet: '✓', drivers: '✓',   trips: '—', fuel: '—',   analytics: 'View' },
                    { role: 'Dispatcher',        fleet: 'View', drivers: '—', trips: '✓', fuel: '—',   analytics: '—' },
                    { role: 'Safety Officer',    fleet: '—', drivers: '✓',   trips: 'View', fuel: '—', analytics: '—' },
                    { role: 'Financial Analyst', fleet: 'View', drivers: '—', trips: '—', fuel: '✓',   analytics: 'View' },
                  ].map(row => (
                    <tr key={row.role}>
                      <td className="py-2 pr-4 font-medium text-foreground">{row.role}</td>
                      {[row.fleet, row.drivers, row.trips, row.fuel, row.analytics].map((val, i) => (
                        <td key={i} className={`text-center py-2 px-3 ${val === '—' ? 'text-muted-foreground' : 'text-green-400 font-medium'}`}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeTable employees={employees} />
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
