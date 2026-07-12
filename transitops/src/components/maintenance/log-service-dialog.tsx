'use client'

import { useState, useTransition } from 'react'
import { Vehicle } from '@prisma/client'
import { createMaintenanceRecord } from '@/app/actions/maintenance'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

type VehicleOption = Pick<Vehicle, 'id' | 'nameModel' | 'regNo'>

export function LogServiceDialog({ vehicles }: { vehicles: VehicleOption[] }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [vehicleId, setVehicleId]     = useState('')
  const [serviceType, setServiceType] = useState('')
  const [cost, setCost]               = useState('')
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes]             = useState('')

  function resetForm() {
    setVehicleId('')
    setServiceType('')
    setCost('')
    setDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createMaintenanceRecord({
        vehicleId,
        serviceType,
        cost: Number(cost),
        date,
        notes: notes || undefined,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      toast.success('Maintenance record logged — vehicle set to In Shop')
      setOpen(false)
      resetForm()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); setOpen(o) }}>
      <DialogTrigger render={<Button className="flex items-center gap-2" />}>
        <Plus className="h-4 w-4" />
        Log Service
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Maintenance Service</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle</Label>
            <select
              id="vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nameModel} — {v.regNo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Input
              id="serviceType"
              placeholder="e.g. Oil Change, Tyre Replace"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₹)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any additional details"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setOpen(false); resetForm() }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Logging...' : 'Log Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
