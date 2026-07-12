import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { getEligibleVehicles, getEligibleDrivers } from '@/lib/transitions'
import { Header } from '@/components/layout/header'
import { TripsClient } from '@/components/trips/trips-client'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Trip Dispatch & Management — TransitOps',
  description: 'Dispatch trips, assign drivers and vehicles, and track active routes.',
}

export default async function TripsPage() {
  const session = await auth()

  if (!session?.user) {
    return null // Layout redirect will handle this
  }

  const role = (session.user as any).role

  // Verify view permissions for trips
  if (!can(role, 'trips', 'view')) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Trips" />
        <main className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full bg-card p-8 rounded-xl border border-border text-center space-y-6 shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
              <p className="text-sm text-muted-foreground">
                Your role as <span className="font-semibold text-primary">{role}</span> does not have permissions to access Trip Management.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/dashboard" className={buttonVariants({ variant: 'default', className: 'w-full gap-2' })}>
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Fetch trips and eligible assets in parallel
  const [trips, eligibleVehicles, eligibleDrivers] = await Promise.all([
    prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true, driver: true },
    }),
    getEligibleVehicles(),
    getEligibleDrivers(),
  ])

  const canEdit = can(role, 'trips', 'edit')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Trip Dispatch & Operations" />
      <main className="flex-1 overflow-y-auto p-6">
        <TripsClient
          initialTrips={trips}
          eligibleVehicles={eligibleVehicles}
          eligibleDrivers={eligibleDrivers}
          canEdit={canEdit}
        />
      </main>
    </div>
  )
}
