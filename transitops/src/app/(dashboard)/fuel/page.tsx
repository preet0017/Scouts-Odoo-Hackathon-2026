import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { FuelClient } from '@/components/fuel/fuel-client'

async function getFuelData() {
  const [vehicles, trips, fuelLogs, expenses, fuelAgg, maintAgg] = await Promise.all([
    prisma.vehicle.findMany({
      select: { id: true, nameModel: true, regNo: true },
      orderBy: { nameModel: 'asc' },
    }),
    prisma.trip.findMany({
      where: { status: { in: ['DRAFT', 'DISPATCHED', 'COMPLETED'] } },
      select: { id: true, source: true, destination: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.fuelLog.findMany({
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, nameModel: true, regNo: true } },
        trip:    { select: { id: true, source: true, destination: true, status: true } },
      },
    }),
    prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { id: true, nameModel: true, regNo: true } },
        trip:    { select: { id: true, source: true, destination: true, status: true } },
      },
    }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
  ])

  return {
    vehicles,
    trips,
    fuelLogs,
    expenses,
    totalFuel:  fuelAgg._sum.cost  ?? 0,
    totalMaint: maintAgg._sum.cost ?? 0,
  }
}

export default async function FuelPage() {
  const data = await getFuelData()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Fuel &amp; Expenses" />
      <main className="flex-1 overflow-y-auto p-6">
        <FuelClient {...data} />
      </main>
    </div>
  )
}
