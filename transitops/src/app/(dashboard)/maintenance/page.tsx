import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogServiceDialog } from '@/components/maintenance/logservicedialog'
import { MaintenanceLogTable } from '@/components/maintenance/maintenancelogtable'
import { getMaintenanceLogs, getAllVehicles } from '@/app/actions/maintenace'
import { Wrench, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'

export default async function MaintenancePage() {
  const [logs, vehicles] = await Promise.all([
    getMaintenanceLogs(),
    getAllVehicles(),
  ])

  const activeLogs    = logs.filter(l => l.status === 'ACTIVE')
  const completedLogs = logs.filter(l => l.status === 'COMPLETED')
  const totalCost     = logs.reduce((sum, l) => sum + l.cost, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Maintenance" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        <PageHeader
          title="Maintenance"
          description="Log service records and manage vehicle repairs"
          action={<LogServiceDialog vehicles={vehicles} />}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-orange-500/10 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {activeLogs.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vehicles In Shop
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {completedLogs.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Completed Services
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  ₹{totalCost.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Maintenance Cost
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status flow diagram — matches mockup */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-green-500/20 text-green-400 
                                 border border-green-500/30 px-3 py-1 
                                 rounded-full text-xs font-medium">
                  Available
                </span>
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    open record
                  </span>
                </div>
                <span className="bg-orange-500/20 text-orange-400 
                                 border border-orange-500/30 px-3 py-1 
                                 rounded-full text-xs font-medium">
                  In Shop
                </span>
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    close record
                  </span>
                </div>
                <span className="bg-green-500/20 text-green-400 
                                 border border-green-500/30 px-3 py-1 
                                 rounded-full text-xs font-medium">
                  Available
                </span>
              </div>
              <span className="text-xs text-muted-foreground ml-4 
                               border-l border-border pl-4">
                ⚠ In Shop vehicles are removed from the dispatch pool
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Service Log Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Service Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceLogTable logs={logs as any} />
          </CardContent>
        </Card>

      </main>
    </div>
  )
}