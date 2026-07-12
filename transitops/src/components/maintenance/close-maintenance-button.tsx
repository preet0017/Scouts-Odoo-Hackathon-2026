'use client'

import { useState, useTransition } from 'react'
import { closeMaintenanceRecord } from '@/app/actions/maintenance'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

export function CloseMaintenanceButton({ maintenanceId }: { maintenanceId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await closeMaintenanceRecord(maintenanceId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Maintenance closed — vehicle returned to Available')
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10"
        onClick={() => setOpen(true)}
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Close
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close Maintenance?</DialogTitle>
            <DialogDescription>
              This will mark the record as Completed and set the vehicle status back to Available.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? 'Closing...' : 'Confirm Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
