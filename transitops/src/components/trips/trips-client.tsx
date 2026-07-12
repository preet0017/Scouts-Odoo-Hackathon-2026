'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { Trip, Vehicle, Driver, TripStatus } from '@prisma/client'
import {
  Plus, Search, Filter, Play, CheckCircle2, XCircle, Trash2, Edit,
  MapPin, Truck, User, Milestone, Weight, Calendar, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createTrip,
  updateTrip,
  deleteTrip,
  dispatchTripAction,
  completeTripAction,
  cancelTripAction
} from '@/app/actions/trips'
import { toast } from 'sonner'

interface ExtendedTrip extends Trip {
  vehicle: Vehicle
  driver: Driver
}

interface TripsClientProps {
  initialTrips: ExtendedTrip[]
  eligibleVehicles: Vehicle[]
  eligibleDrivers: Driver[]
  canEdit: boolean
}

export function TripsClient({
  initialTrips,
  eligibleVehicles,
  eligibleDrivers,
  canEdit
}: TripsClientProps) {
  const [trips, setTrips] = useState<ExtendedTrip[]>(initialTrips)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [isPending, startTransition] = useTransition()

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<ExtendedTrip | null>(null)

  // Form states
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [cargoWeight, setCargoWeight] = useState('')
  const [plannedDistance, setPlannedDistance] = useState('')
  const [revenue, setRevenue] = useState('')

  // Completion states
  const [finalOdometer, setFinalOdometer] = useState('')
  const [fuelConsumed, setFuelConsumed] = useState('')

  // Sync state with props
  React.useEffect(() => {
    setTrips(initialTrips)
  }, [initialTrips])

  const resetForm = () => {
    setSource('')
    setDestination('')
    setVehicleId('')
    setDriverId('')
    setCargoWeight('')
    setPlannedDistance('')
    setRevenue('')
    setSelectedTrip(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    // Select first eligible vehicle/driver if available
    if (eligibleVehicles.length > 0) setVehicleId(eligibleVehicles[0].id)
    if (eligibleDrivers.length > 0) setDriverId(eligibleDrivers[0].id)
    setIsAddOpen(true)
  }

  const handleOpenEdit = (trip: ExtendedTrip) => {
    setSelectedTrip(trip)
    setSource(trip.source)
    setDestination(trip.destination)
    setVehicleId(trip.vehicleId)
    setDriverId(trip.driverId)
    setCargoWeight(trip.cargoWeight.toString())
    setPlannedDistance(trip.plannedDistance.toString())
    setRevenue(trip.revenue?.toString() || '')
    setIsEditOpen(true)
  }

  const handleOpenComplete = (trip: ExtendedTrip) => {
    setSelectedTrip(trip)
    // Set final odometer default to current odometer + planned distance
    const currentOdo = trip.vehicle.odometer
    const suggestedOdo = currentOdo + trip.plannedDistance
    setFinalOdometer(suggestedOdo.toString())
    setFuelConsumed('')
    setIsCompleteOpen(true)
  }

  const handleOpenDelete = (trip: ExtendedTrip) => {
    setSelectedTrip(trip)
    setIsDeleteOpen(true)
  }

  // Selected vehicle info for cargo weight limits
  const selectedVehicleObj = eligibleVehicles.find(v => v.id === vehicleId) || selectedTrip?.vehicle
  const maxCapacity = selectedVehicleObj?.maxLoadCapacity || 0
  const isWeightExceeded = cargoWeight ? parseFloat(cargoWeight) > maxCapacity : false

  // Selected driver details
  const selectedDriverObj = eligibleDrivers.find(d => d.id === driverId) || selectedTrip?.driver

  const processedTrips = trips.filter((t) => {
    const matchSearch =
      t.source.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.driver.name.toLowerCase().includes(search.toLowerCase()) ||
      t.vehicle.nameModel.toLowerCase().includes(search.toLowerCase()) ||
      t.vehicle.regNo.toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  // Submit operations
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (isWeightExceeded) {
      toast.error(`Cargo weight exceeds the maximum capacity of ${maxCapacity} kg for the selected vehicle.`)
      return
    }

    startTransition(async () => {
      try {
        const newTrip = await createTrip({
          source,
          destination,
          vehicleId,
          driverId,
          cargoWeight: parseFloat(cargoWeight),
          plannedDistance: parseFloat(plannedDistance),
          revenue: revenue ? parseFloat(revenue) : 0,
        })
        toast.success(`Trip ${newTrip.source} ➔ ${newTrip.destination} created in DRAFT.`)
        setIsAddOpen(false)
        resetForm()
      } catch (err: any) {
        toast.error(err.message || 'Failed to create trip.')
      }
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip) return

    if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (isWeightExceeded) {
      toast.error(`Cargo weight exceeds the maximum capacity of ${maxCapacity} kg for the selected vehicle.`)
      return
    }

    startTransition(async () => {
      try {
        await updateTrip(selectedTrip.id, {
          source,
          destination,
          vehicleId,
          driverId,
          cargoWeight: parseFloat(cargoWeight),
          plannedDistance: parseFloat(plannedDistance),
          revenue: revenue ? parseFloat(revenue) : 0,
        })
        toast.success('Trip updated successfully.')
        setIsEditOpen(false)
        resetForm()
      } catch (err: any) {
        toast.error(err.message || 'Failed to update trip.')
      }
    })
  }

  const handleDispatch = (tripId: string, tripInfo: string) => {
    startTransition(async () => {
      try {
        await dispatchTripAction(tripId)
        toast.success(`Trip ${tripInfo} has been DISPATCHED successfully! Vehicle and driver set to On Trip.`)
      } catch (err: any) {
        toast.error(err.message || 'Failed to dispatch trip.')
      }
    })
  }

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip) return

    const finalOdoNum = parseFloat(finalOdometer)
    const fuelNum = parseFloat(fuelConsumed)

    if (isNaN(finalOdoNum) || finalOdoNum <= selectedTrip.vehicle.odometer) {
      toast.error(`Final odometer must be greater than current vehicle odometer (${selectedTrip.vehicle.odometer} km).`)
      return
    }

    if (isNaN(fuelNum) || fuelNum <= 0) {
      toast.error('Please enter a valid fuel quantity.')
      return
    }

    startTransition(async () => {
      try {
        await completeTripAction(selectedTrip.id, finalOdoNum, fuelNum)
        toast.success('Trip marked as COMPLETED. Vehicle and driver returned to Available.')
        setIsCompleteOpen(false)
        setSelectedTrip(null)
      } catch (err: any) {
        toast.error(err.message || 'Failed to complete trip.')
      }
    })
  }

  const handleCancel = (tripId: string, tripInfo: string) => {
    startTransition(async () => {
      try {
        await cancelTripAction(tripId)
        toast.success(`Trip ${tripInfo} cancelled. Assets set back to Available.`)
      } catch (err: any) {
        toast.error(err.message || 'Failed to cancel trip.')
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!selectedTrip) return

    startTransition(async () => {
      try {
        await deleteTrip(selectedTrip.id)
        toast.success('Trip deleted successfully.')
        setIsDeleteOpen(false)
        setSelectedTrip(null)
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete trip.')
      }
    })
  }

  // Count helper
  const counts = {
    total: trips.length,
    draft: trips.filter(t => t.status === 'DRAFT').length,
    dispatched: trips.filter(t => t.status === 'DISPATCHED').length,
    completed: trips.filter(t => t.status === 'COMPLETED').length,
    cancelled: trips.filter(t => t.status === 'CANCELLED').length,
  }

  // Generate dropdown lists for edit that includes currently assigned values even if not status AVAILABLE
  const getVehiclesDropdown = () => {
    const list = [...eligibleVehicles]
    if (selectedTrip && !list.some(v => v.id === selectedTrip.vehicleId)) {
      list.push(selectedTrip.vehicle)
    }
    return list
  }

  const getDriversDropdown = () => {
    const list = [...eligibleDrivers]
    if (selectedTrip && !list.some(d => d.id === selectedTrip.driverId)) {
      list.push(selectedTrip.driver)
    }
    return list
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/80 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Trips</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-foreground">{counts.total}</span>
              <span className="text-xs text-muted-foreground">runs</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-500/5 border-neutral-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Draft / Scheduled</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-neutral-400">{counts.draft}</span>
              <span className="text-xs text-neutral-500/70">pending</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Dispatched</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-blue-400">{counts.dispatched}</span>
              <span className="text-xs text-blue-500/70">active</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Completed</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-green-400">{counts.completed}</span>
              <span className="text-xs text-green-500/70">fulfilled</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/10 shadow-md col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Cancelled</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-red-400">{counts.cancelled}</span>
              <span className="text-xs text-red-500/70">aborted</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Action Box */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by route, driver name, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full bg-background"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-lg border border-input h-9 text-sm w-fit shrink-0">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 outline-hidden font-medium text-foreground text-xs"
            >
              <option value="ALL">All Trip Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {canEdit && (
          <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 shadow-lg bg-primary hover:bg-primary/95">
            <Plus className="h-4 w-4" /> Create Trip
          </Button>
        )}
      </div>

      {/* Trips list grid */}
      <div className="grid grid-cols-1 gap-4">
        {processedTrips.map((trip) => {
          const isDraft = trip.status === 'DRAFT'
          const isDispatched = trip.status === 'DISPATCHED'
          const tripRoute = `${trip.source} ➔ ${trip.destination}`

          return (
            <Card key={trip.id} className="border border-border/80 bg-card hover:border-border transition-all shadow-sm">
              <CardContent className="p-5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                
                {/* Trip Route & ID Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground font-bold px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded">
                      TRIP-{trip.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-bold text-base text-foreground truncate">{trip.source}</span>
                    <span className="text-muted-foreground font-medium mx-1">➔</span>
                    <span className="font-bold text-base text-foreground truncate">{trip.destination}</span>
                  </div>
                </div>

                {/* Dispatch Asset Assignment */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8 flex-2 w-full lg:w-auto text-xs py-2 border-y lg:border-y-0 border-border/60">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Vehicle
                    </span>
                    <p className="font-bold text-foreground truncate">{trip.vehicle.nameModel}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{trip.vehicle.regNo}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <User className="h-3 w-3" /> Driver
                    </span>
                    <p className="font-bold text-foreground truncate">{trip.driver.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      Score: <span className="font-bold text-yellow-500">{trip.driver.safetyScore}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Weight className="h-3 w-3" /> Cargo / Payload
                    </span>
                    <p className="font-bold text-foreground">{trip.cargoWeight} kg</p>
                    <p className="text-[10px] text-muted-foreground truncate">Max cap: {trip.vehicle.maxLoadCapacity} kg</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Milestone className="h-3 w-3" /> Distance
                    </span>
                    <p className="font-bold text-foreground">{trip.plannedDistance} km</p>
                    {trip.revenue && (
                      <p className="text-[10px] text-green-400 font-semibold">
                        Est. Rev: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(trip.revenue)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 shrink-0">
                  {isDraft && canEdit && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleDispatch(trip.id, tripRoute)}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" /> Dispatch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(trip)}
                        disabled={isPending}
                        className="gap-1"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(trip.id, tripRoute)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDelete(trip)}
                        disabled={isPending}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}

                  {isDispatched && canEdit && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleOpenComplete(trip)}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete Trip
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(trip.id, tripRoute)}
                        disabled={isPending}
                        className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive gap-1"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel Dispatch
                      </Button>
                    </>
                  )}

                  {(!isDraft && !isDispatched) && (
                    <div className="text-xs text-muted-foreground font-mono flex flex-col gap-1 items-end pr-2">
                      <span>Closed: {new Date(trip.updatedAt).toLocaleDateString()}</span>
                      {trip.finalOdometer && (
                        <span>End Odo: {trip.finalOdometer.toLocaleString()} km</span>
                      )}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          )
        })}

        {processedTrips.length === 0 && (
          <Card className="border border-dashed border-border py-12 text-center text-muted-foreground">
            <CardContent>No trips match the current filters or search query.</CardContent>
          </Card>
        )}
      </div>

      {/* Create Trip Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Milestone className="h-5 w-5 text-primary" /> Create Dispatch Trip
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Schedule a new transport trip. Assets can only be dispatched if they are AVAILABLE and compliant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Source Hub / Location</label>
                <Input
                  required
                  placeholder="e.g. Warehouse Alpha"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Destination Hub / Location</label>
                <Input
                  required
                  placeholder="e.g. Depot Bangalore"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Available Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring"
                >
                  <option value="" disabled>-- Select Vehicle --</option>
                  {eligibleVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nameModel} ({v.regNo}) - Cap: {v.maxLoadCapacity} kg
                    </option>
                  ))}
                  {eligibleVehicles.length === 0 && (
                    <option value="" disabled>No Available Vehicles</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Available Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring"
                >
                  <option value="" disabled>-- Select Driver --</option>
                  {eligibleDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Safety: {d.safetyScore})
                    </option>
                  ))}
                  {eligibleDrivers.length === 0 && (
                    <option value="" disabled>No Eligible Drivers</option>
                  )}
                </select>
              </div>
            </div>

            {/* Asset quick status check */}
            {(selectedVehicleObj || selectedDriverObj) && (
              <div className="p-3 bg-muted/30 border border-border/50 rounded-lg text-xs space-y-1.5">
                {selectedVehicleObj && (
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5 text-primary" /> Selected: <strong className="text-foreground">{selectedVehicleObj.nameModel}</strong>. Capacity: <strong className="text-foreground">{selectedVehicleObj.maxLoadCapacity} kg</strong>. Current Odo: <strong className="text-foreground">{selectedVehicleObj.odometer} km</strong>.
                  </p>
                )}
                {selectedDriverObj && (
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary" /> Selected: <strong className="text-foreground">{selectedDriverObj.name}</strong>. License Category: <strong className="text-foreground">{selectedDriverObj.licenseCategory}</strong>. Expiry: <strong className="text-foreground">{new Date(selectedDriverObj.licenseExpiry).toLocaleDateString()}</strong>.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Cargo Payload Weight (kg)</label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 450"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  className={isWeightExceeded ? "border-destructive focus-visible:ring-destructive/30" : "bg-background"}
                />
                {isWeightExceeded && (
                  <p className="text-[10px] text-destructive flex items-center gap-1 font-semibold">
                    <AlertTriangle className="h-3 w-3" /> Exceeds vehicle load capacity ({maxCapacity} kg)!
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Planned Distance (km)</label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 350"
                  value={plannedDistance}
                  onChange={(e) => setPlannedDistance(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Estimated revenue (INR) - Optional</label>
              <Input
                type="number"
                placeholder="e.g. 15000"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="bg-background"
              />
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isWeightExceeded} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
                {isPending ? 'Creating...' : 'Create Draft Trip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Trip Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Modify Trip Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the routing, cargo weight, or assigned assets for this DRAFT trip.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Source Hub / Location</label>
                <Input
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Destination Hub / Location</label>
                <Input
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring"
                >
                  {getVehiclesDropdown().map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nameModel} ({v.regNo}) {v.id === selectedTrip?.vehicleId ? '(Currently Assigned)' : ''} - Cap: {v.maxLoadCapacity} kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring"
                >
                  {getDriversDropdown().map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.id === selectedTrip?.driverId ? '(Currently Assigned)' : ''} (Safety: {d.safetyScore})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Cargo Payload Weight (kg)</label>
                <Input
                  required
                  type="number"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  className={isWeightExceeded ? "border-destructive focus-visible:ring-destructive/30" : "bg-background"}
                />
                {isWeightExceeded && (
                  <p className="text-[10px] text-destructive flex items-center gap-1 font-semibold">
                    <AlertTriangle className="h-3 w-3" /> Exceeds vehicle load capacity ({maxCapacity} kg)!
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Planned Distance (km)</label>
                <Input
                  required
                  type="number"
                  value={plannedDistance}
                  onChange={(e) => setPlannedDistance(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Estimated revenue (INR)</label>
              <Input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="bg-background"
              />
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isWeightExceeded} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Trip Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-green-500">
              <ShieldCheck className="h-5 w-5" /> Fulfill & Complete Trip
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record final trip outcomes to release the vehicle and driver back into the selection pool.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompleteSubmit} className="space-y-4 py-2">
            <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
              <p>Trip: <strong>{selectedTrip?.source} ➔ {selectedTrip?.destination}</strong></p>
              <p>Vehicle: <strong>{selectedTrip?.vehicle.nameModel} ({selectedTrip?.vehicle.regNo})</strong></p>
              <p>Current Vehicle Odometer: <strong>{selectedTrip?.vehicle.odometer.toLocaleString()} km</strong></p>
              <p>Planned Distance: <strong>{selectedTrip?.plannedDistance} km</strong></p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Final Odometer Reading (km)</label>
              <Input
                required
                type="number"
                value={finalOdometer}
                onChange={(e) => setFinalOdometer(e.target.value)}
                className="bg-background"
              />
              <p className="text-[10px] text-muted-foreground">Must be greater than current odometer: {selectedTrip?.vehicle.odometer} km.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Fuel Consumed (Liters)</label>
              <Input
                required
                type="number"
                step="0.01"
                placeholder="e.g. 45.5"
                value={fuelConsumed}
                onChange={(e) => setFuelConsumed(e.target.value)}
                className="bg-background"
              />
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCompleteOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                {isPending ? 'Submitting...' : 'Complete Trip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete Trip Record?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this trip?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-foreground/80">
            <p>This will remove the trip record from the system. This action is irreversible.</p>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/95 text-destructive-foreground font-semibold">
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
