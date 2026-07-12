'use client'

import { useTransition } from 'react'
import { closeMaintenanceRecord } from '@/app/actions/maintenance'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

export function CloseMaintenanceButton({
  maintenanceId,
  vehicleName,
}: {
  maintenanceId: string
  vehicleName: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    startTransition(async () => {
      const result = await closeMaintenanceRecord(maintenanceId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(`${vehicleName} maintenance closed — vehicle now Available`)
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClose}
      disabled={isPending}
      className="h-8 px-3 text-xs border-green-500/30 
                 text-green-400 hover:bg-green-500/10"
    >
      <CheckCircle className="h-3 w-3 mr-1" />
      {isPending ? 'Closing...' : 'Close'}
    </Button>
  )
}