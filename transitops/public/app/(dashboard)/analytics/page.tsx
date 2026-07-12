import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthlyRevenueChart, CostlyVehiclesChart } from '@/components/analytics/analytics-charts'
import { Gauge, TrendingUp, DollarSign, BarChart2 } from 'lucide-react'
import { format } from 'date-fns'

async function getAnalyticsData() {
  const [
    vehicles,
    totalVehicles,
    onTripVehicles,
    fuelAgg,
    maintAgg,
    tripStats,
    acqCostAgg,
    completedTrips,
    vehiclesWithCosts,
  ] = await Promise.all([
    prisma.vehicle.findMany({ select: { id: true } }),
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
    prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.trip.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { plannedDistance: true, fuelConsumed: true, revenue: true },
    }),
    prisma.vehicle.aggregate({ _sum: { acquisitionCost: true } }),
    prisma.trip.findMany({
      where: { status: 'COMPLETED', revenue: { not: null } },
      select: { revenue: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.vehicle.findMany({
      select: {
        id: true,
        nameModel: true,
        regNo: true,
        maintenanceLogs: { select: { cost: true } },
        fuelLogs:        { select: { cost: true } },
      },
    }),
  ])

  // KPIs
  const totalFuelCost  = fuelAgg._sum.cost  ?? 0
  const totalMaintCost = maintAgg._sum.cost ?? 0
  const operationalCost = totalFuelCost + totalMaintCost

  const totalDist     = tripStats._sum.plannedDistance ?? 0
  const totalFuelUsed = tripStats._sum.fuelConsumed    ?? 0
  const fuelEfficiency = totalFuelUsed > 0
    ? parseFloat((totalDist / totalFuelUsed).toFixed(2))
    : 0

  const fleetUtilization = totalVehicles > 0
    ? Math.round((onTripVehicles / totalVehicles) * 100)
    : 0

  const totalRevenue  = tripStats._sum.revenue   ?? 0
  const totalAcqCost  = acqCostAgg._sum.acquisitionCost ?? 1
  const vehicleROI    = parseFloat(
    (((totalRevenue - operationalCost) / totalAcqCost) * 100).toFixed(2)
  )

  // Monthly Revenue — group completed trips by month
  const monthlyMap: Record<string, number> = {}
  completedTrips.forEach(t => {
    const key = format(new Date(t.createdAt), 'MMM yy')
    monthlyMap[key] = (monthlyMap[key] ?? 0) + (t.revenue ?? 0)
  })
  const monthlyRevenue = Object.entries(monthlyMap)
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue }))

  // Top costliest vehicles
  const vehicleCosts = vehiclesWithCosts
    .map(v => ({
      name: `${v.nameModel} (${v.regNo})`,
      cost:
        v.maintenanceLogs.reduce((s, m) => s + m.cost, 0) +
        v.fuelLogs.reduce((s, f) => s + f.cost, 0),
    }))
    .filter(v => v.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5)
    .map(v => ({ ...v, name: v.name.length > 20 ? v.name.slice(0, 20) + '…' : v.name }))

  return {
    fuelEfficiency,
    fleetUtilization,
    operationalCost,
    vehicleROI,
    monthlyRevenue,
    vehicleCosts,
  }
}

export default async function AnalyticsPage() {
  const {
    fuelEfficiency,
    fleetUtilization,
    operationalCost,
    vehicleROI,
    monthlyRevenue,
    vehicleCosts,
  } = await getAnalyticsData()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Analytics" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Fuel Efficiency"
            value={`${fuelEfficiency} km/l`}
            icon={Gauge}
            color="green"
            subtitle="Distance / Fuel consumed"
          />
          <KpiCard
            title="Fleet Utilization"
            value={`${fleetUtilization}%`}
            icon={BarChart2}
            color={fleetUtilization > 70 ? 'green' : fleetUtilization > 40 ? 'orange' : 'red'}
            subtitle="On Trip / Total Vehicles"
          />
          <KpiCard
            title="Operational Cost"
            value={`₹${operationalCost.toLocaleString()}`}
            icon={DollarSign}
            color="orange"
            subtitle="Fuel + Maintenance"
          />
          <KpiCard
            title="Vehicle ROI"
            value={`${vehicleROI}%`}
            icon={TrendingUp}
            color={vehicleROI >= 0 ? 'blue' : 'red'}
            subtitle="(Revenue − OpCost) / AcqCost"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Monthly Revenue — wider */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyRevenue.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                  No completed trips with revenue yet
                </div>
              ) : (
                <MonthlyRevenueChart data={monthlyRevenue} />
              )}
            </CardContent>
          </Card>

          {/* Top Costliest Vehicles */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Top Costliest Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleCosts.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No cost data yet
                </div>
              ) : (
                <CostlyVehiclesChart data={vehicleCosts} />
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  )
}
