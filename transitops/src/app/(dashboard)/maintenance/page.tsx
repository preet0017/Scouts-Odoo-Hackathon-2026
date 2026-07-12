import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMaintenanceLogs, getAllVehicles } from '@/app/actions/maintenance'
import { MaintenanceLogTable } from '@/components/maintenance/maintenance-log-table'
import { LogServiceDialog } from '@/components/maintenance/log-service-dialog'
import { can } from '@/lib/rbac'
import { Role, MaintenanceStatus } from '@prisma/client'
import { Wrench, CheckCircle, Clock, IndianRupee } from 'lucide-react'

export default async function MaintenancePage() {
  const session = await auth()
  const role = (session?.user as any)?.role as Role
  if (!role) redirect('/login')

  const canEdit = can(role, 'maintenance', 'edit')

  const [logs, vehicles] = await Promise.all([
    getMaintenanceLogs(),
    canEdit ? getAllVehicles() : Promise.resolve([]),
  ])

  const activeCount    = logs.filter(l => l.status === MaintenanceStatus.ACTIVE).length
  const completedCount = logs.filter(l => l.status === MaintenanceStatus.COMPLETED).length
  const totalCost      = logs.reduce((sum, l) => sum + l.cost, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Maintenance" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        <PageHeader
          title="Maintenance Logs"
          description="Track service records and vehicle shop status"
          action={canEdit ? <LogServiceDialog vehicles={vehicles} /> : undefined}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-orange-500/10 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <IndianRupee className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalCost.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Records</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceLogTable logs={logs} canEdit={canEdit} />
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
