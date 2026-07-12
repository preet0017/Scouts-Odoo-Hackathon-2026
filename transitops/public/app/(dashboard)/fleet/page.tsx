import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { Header } from '@/components/layout/header'
import { FleetClient } from '@/components/fleet/fleet-client'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Fleet Management — TransitOps',
  description: 'Manage fleet vehicles, status, and odometer logs.',
}

export default async function FleetPage() {
  const session = await auth()
  
  if (!session?.user) {
    return null // Layout redirect will handle this
  }

  const role = (session.user as any).role
  
  // Verify view permissions
  if (!can(role, 'fleet', 'view')) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Fleet" />
        <main className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full bg-card p-8 rounded-xl border border-border text-center space-y-6 shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
              <p className="text-sm text-muted-foreground">
                Your role as <span className="font-semibold text-primary">{role}</span> does not have permissions to view the Fleet Registry.
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

  // Fetch all vehicles
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { nameModel: 'asc' },
  })

  const canEdit = can(role, 'fleet', 'edit')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Fleet Registry" />
      <main className="flex-1 overflow-y-auto p-6">
        <FleetClient initialVehicles={vehicles} userRole={role} canEdit={canEdit} />
      </main>
    </div>
  )
}
