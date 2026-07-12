import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { KpiCard } from '@/components/ui/kpi-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { VehicleStatusChart } from '@/components/dashboard/vehicle-status-chart'
import {
  Truck, CheckCircle, Wrench, MapPin,
  Clock, Users, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'

async function getDashboardData() {
  const [
    activeVehicles,
    availableVehicles,
    inShopVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    totalVehicles,
    recentTrips,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
    prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
    prisma.vehicle.count({ where: { status: 'RETIRED' } }),
    prisma.trip.count({ where: { status: 'DISPATCHED' } }),
    prisma.trip.count({ where: { status: 'DRAFT' } }),
    prisma.driver.count({ where: { status: 'ON_TRIP' } }),
    prisma.vehicle.count(),
    prisma.trip.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true, driver: true },
    }),
  ])

  const fleetUtilization = totalVehicles > 0
    ? Math.round((activeVehicles / totalVehicles) * 100)
    : 0

  return {
    kpis: {
      activeVehicles,
      availableVehicles,
      inShopVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
    },
    chartData: [
      { name: 'Available', value: availableVehicles, fill: '#22c55e' },
      { name: 'On Trip',   value: activeVehicles,    fill: '#3b82f6' },
      { name: 'In Shop',   value: inShopVehicles,    fill: '#f97316' },
      { name: 'Retired',   value: retiredVehicles,   fill: '#ef4444' },
    ],
    recentTrips,
  }
}

export default async function DashboardPage() {
  await auth()
  const { kpis, chartData, recentTrips } = await getDashboardData()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Active Vehicles"    value={kpis.activeVehicles}    icon={Truck}       color="blue" />
          <KpiCard title="Available Vehicles" value={kpis.availableVehicles} icon={CheckCircle} color="green" />
          <KpiCard title="In Maintenance"     value={kpis.inShopVehicles}    icon={Wrench}      color="orange" />
          <KpiCard title="Active Trips"       value={kpis.activeTrips}       icon={MapPin}      color="blue" />
          <KpiCard title="Pending Trips"      value={kpis.pendingTrips}      icon={Clock}       color="default" />
          <KpiCard title="Drivers On Duty"    value={kpis.driversOnDuty}     icon={Users}       color="purple" />
          <KpiCard
            title="Fleet Utilization"
            value={`${kpis.fleetUtilization}%`}
            icon={Activity}
            color={kpis.fleetUtilization > 70 ? 'green' : kpis.fleetUtilization > 40 ? 'orange' : 'red'}
            subtitle="On Trip / Total Vehicles"
          />
        </div>

        {/* Charts + Recent Trips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Vehicle Status</CardTitle>
            </CardHeader>
            <CardContent>
              <VehicleStatusChart data={chartData} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Recent Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {trip.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {trip.vehicle.nameModel}
                      </TableCell>
                      <TableCell>{trip.driver.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={trip.status as any} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {trip.eta
                          ? formatDistanceToNow(new Date(trip.eta), { addSuffix: true })
                          : trip.status === 'COMPLETED'
                            ? '—'
                            : 'Awaiting vehicle'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentTrips.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No trips yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
