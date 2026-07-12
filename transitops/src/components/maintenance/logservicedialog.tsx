'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createMaintenanceRecord } from '@/app/actions/maintenance'
import {
  Dialog, DialogContent,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const schema = z.object({
  vehicleId:   z.string().min(1, 'Vehicle is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  cost:        z.coerce.number().min(0, 'Cost must be 0 or more'),
  date:        z.string().min(1, 'Date is required'),
  notes:       z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Vehicle = {
  id: string
  nameModel: string
  regNo: string
  status: string
}

export function LogServiceDialog({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      cost: 0,
    }
  })

  function onSubmit(data: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createMaintenanceRecord(data)
      if (result?.error) {
        setError(result.error)
        return
      }
      toast.success('Maintenance record created — vehicle moved to In Shop')
      setOpen(false)
      reset()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Log Service Record
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Service Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Vehicle */}
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <Select onValueChange={(val) => setValue('vehicleId', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <div className="flex items-center gap-2">
                      <span>{v.nameModel}</span>
                      <span className="text-muted-foreground text-xs">
                        ({v.regNo})
                      </span>
                      {v.status === 'ON_TRIP' && (
                        <span className="text-xs text-orange-400">
                          — On Trip
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleId && (
              <p className="text-xs text-destructive">
                {errors.vehicleId.message}
              </p>
            )}
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type</Label>
            <Input
              placeholder="e.g. Oil Change, Engine Repair, Tyre Replace"
              {...register('serviceType')}
            />
            {errors.serviceType && (
              <p className="text-xs text-destructive">
                {errors.serviceType.message}
              </p>
            )}
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label>Cost (₹)</Label>
            <Input
              type="number"
              placeholder="2500"
              {...register('cost')}
            />
            {errors.cost && (
              <p className="text-xs text-destructive">
                {errors.cost.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-xs text-destructive">
                {errors.date.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="Additional details..."
              {...register('notes')}
            />
          </div>

          {/* Info box */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <p className="text-xs text-orange-300">
              ⚠ Creating this record will automatically move the vehicle
              to <strong>In Shop</strong> status and remove it from
              the dispatch pool.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}