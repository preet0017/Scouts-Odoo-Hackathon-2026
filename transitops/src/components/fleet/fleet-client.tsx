'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { Vehicle, VehicleType, VehicleStatus } from '@prisma/client'
import { Plus, Search, Filter, ArrowUpDown, Edit, Trash2, ShieldAlert, Truck, Car, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createVehicle, updateVehicle, deleteVehicle } from '@/app/actions/fleet'
import { toast } from 'sonner'

interface FleetClientProps {
  initialVehicles: Vehicle[]
  userRole: string
  canEdit: boolean
}

type SortField = 'nameModel' | 'regNo' | 'maxLoadCapacity' | 'odometer' | 'acquisitionCost'
type SortOrder = 'asc' | 'desc'

export function FleetClient({ initialVehicles, userRole, canEdit }: FleetClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  
  const [sortField, setSortField] = useState<SortField>('nameModel')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  // Form states
  const [regNo, setRegNo] = useState('')
  const [nameModel, setNameModel] = useState('')
  const [type, setType] = useState<VehicleType>('VAN')
  const [maxLoadCapacity, setMaxLoadCapacity] = useState('')
  const [odometer, setOdometer] = useState('')
  const [acquisitionCost, setAcquisitionCost] = useState('')
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE')

  const [isPending, startTransition] = useTransition()

  // Sync state with props
  React.useEffect(() => {
    setVehicles(initialVehicles)
  }, [initialVehicles])

  // Reset form helper
  const resetForm = () => {
    setRegNo('')
    setNameModel('')
    setType('VAN')
    setMaxLoadCapacity('')
    setOdometer('')
    setAcquisitionCost('')
    setStatus('AVAILABLE')
    setSelectedVehicle(null)
  }

  // Handle open add modal
  const handleOpenAdd = () => {
    resetForm()
    setIsAddOpen(true)
  }

  // Handle open edit modal
  const handleOpenEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setRegNo(vehicle.regNo)
    setNameModel(vehicle.nameModel)
    setType(vehicle.type)
    setMaxLoadCapacity(vehicle.maxLoadCapacity.toString())
    setOdometer(vehicle.odometer.toString())
    setAcquisitionCost(vehicle.acquisitionCost.toString())
    setStatus(vehicle.status)
    setIsEditOpen(true)
  }

  // Handle open delete modal
  const handleOpenDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDeleteOpen(true)
  }

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filtering + Sorting processing
  const processedVehicles = vehicles
    .filter((v) => {
      const matchSearch =
        v.nameModel.toLowerCase().includes(search.toLowerCase()) ||
        v.regNo.toLowerCase().includes(search.toLowerCase())
      
      const matchStatus = statusFilter === 'ALL' || v.status === statusFilter
      const matchType = typeFilter === 'ALL' || v.type === typeFilter

      return matchSearch && matchStatus && matchType
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === 'nameModel' || sortField === 'regNo') {
        comparison = a[sortField].localeCompare(b[sortField])
      } else {
        comparison = (a[sortField] as number) - (b[sortField] as number)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // CRUD actions
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regNo || !nameModel || !maxLoadCapacity || !odometer || !acquisitionCost) {
      toast.error('All fields are required.')
      return
    }

    startTransition(async () => {
      try {
        const newVehicle = await createVehicle({
          regNo,
          nameModel,
          type,
          maxLoadCapacity: parseFloat(maxLoadCapacity),
          odometer: parseFloat(odometer),
          acquisitionCost: parseFloat(acquisitionCost),
          status,
        })
        toast.success(`Vehicle ${newVehicle.nameModel} registered successfully.`)
        setIsAddOpen(false)
        resetForm()
      } catch (err: any) {
        toast.error(err.message || 'Failed to register vehicle.')
      }
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return

    if (!regNo || !nameModel || !maxLoadCapacity || !odometer || !acquisitionCost) {
      toast.error('All fields are required.')
      return
    }

    startTransition(async () => {
      try {
        await updateVehicle(selectedVehicle.id, {
          regNo,
          nameModel,
          type,
          maxLoadCapacity: parseFloat(maxLoadCapacity),
          odometer: parseFloat(odometer),
          acquisitionCost: parseFloat(acquisitionCost),
          status,
        })
        toast.success(`Vehicle ${nameModel} updated successfully.`)
        setIsEditOpen(false)
        resetForm()
      } catch (err: any) {
        toast.error(err.message || 'Failed to update vehicle.')
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!selectedVehicle) return

    startTransition(async () => {
      try {
        const res = await deleteVehicle(selectedVehicle.id)
        if (res.retired) {
          toast.info(`Vehicle has existing history. It has been marked as RETIRED instead of deleted.`)
        } else {
          toast.success('Vehicle deleted successfully.')
        }
        setIsDeleteOpen(false)
        resetForm()
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete vehicle.')
      }
    })
  }

  // Count helper
  const counts = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    inShop: vehicles.filter(v => v.status === 'IN_SHOP').length,
    onTrip: vehicles.filter(v => v.status === 'ON_TRIP').length,
    retired: vehicles.filter(v => v.status === 'RETIRED').length,
  }

  return (
    <div className="space-y-6">
      {/* Fleet Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 backdrop-blur-md border-border/80 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Fleet</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-foreground">{counts.total}</span>
              <span className="text-xs text-muted-foreground">vehicles</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Available</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-green-400">{counts.available}</span>
              <span className="text-xs text-green-500/70">active</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">On Trip</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-blue-400">{counts.onTrip}</span>
              <span className="text-xs text-blue-500/70">dispatched</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">In Shop</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-orange-400">{counts.inShop}</span>
              <span className="text-xs text-orange-500/70">maintenance</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/10 shadow-md col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Retired</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-red-400">{counts.retired}</span>
              <span className="text-xs text-red-500/70">out of service</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Model or Reg No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full bg-background"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-lg border border-input h-9 text-sm">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-medium text-foreground text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="IN_SHOP">In Shop</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-lg border border-input h-9 text-sm">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-medium text-foreground text-xs"
              >
                <option value="ALL">All Types</option>
                <option value="VAN">Van</option>
                <option value="TRUCK">Truck</option>
                <option value="MINI">Mini</option>
              </select>
            </div>
          </div>
        </div>

        {canEdit && (
          <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 shadow-lg bg-primary hover:bg-primary/95">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        )}
      </div>

      {/* Main Table */}
      <Card className="border border-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-4 align-middle">
                  <button onClick={() => handleSort('nameModel')} className="flex items-center gap-1 hover:text-foreground">
                    Vehicle Model <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">
                  <button onClick={() => handleSort('regNo')} className="flex items-center gap-1 hover:text-foreground">
                    Plate / Reg No <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">Type</th>
                <th className="p-4 align-middle">
                  <button onClick={() => handleSort('maxLoadCapacity')} className="flex items-center gap-1 hover:text-foreground">
                    Max Capacity <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">
                  <button onClick={() => handleSort('odometer')} className="flex items-center gap-1 hover:text-foreground">
                    Odometer <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">
                  <button onClick={() => handleSort('acquisitionCost')} className="flex items-center gap-1 hover:text-foreground">
                    Acq. Cost <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">Status</th>
                {canEdit && <th className="p-4 align-middle text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {processedVehicles.map((vehicle) => {
                const TypeIcon = vehicle.type === 'TRUCK' ? Truck : vehicle.type === 'VAN' ? Car : Layers
                return (
                  <tr key={vehicle.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{vehicle.nameModel}</td>
                    <td className="p-4">
                      <div className="inline-block px-2 py-0.5 bg-neutral-900 border border-neutral-700/60 rounded text-yellow-500 font-mono text-xs font-bold uppercase tracking-wider">
                        {vehicle.regNo}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize text-xs font-medium">{vehicle.type.toLowerCase()}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-foreground">{vehicle.maxLoadCapacity.toLocaleString()} kg</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{vehicle.odometer.toLocaleString()} km</td>
                    <td className="p-4 font-medium text-foreground">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(vehicle.acquisitionCost)}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={vehicle.status} />
                    </td>
                    {canEdit && (
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEdit(vehicle)}
                            title="Edit Vehicle"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenDelete(vehicle)}
                            disabled={vehicle.status === 'ON_TRIP'}
                            title={vehicle.status === 'ON_TRIP' ? 'Cannot delete/retire vehicle on active trip' : 'Delete Vehicle'}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {processedVehicles.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="p-8 text-center text-muted-foreground">
                    No vehicles found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Vehicle Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Register New Vehicle
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new vehicle to the transport fleet system. All fields are mandatory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Plate / Registration No</label>
                <Input
                  required
                  placeholder="e.g. VAN-05"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Model / Name</label>
                <Input
                  required
                  placeholder="e.g. Toyota HiAce"
                  value={nameModel}
                  onChange={(e) => setNameModel(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Vehicle Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as VehicleType)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring focus:ring-1 focus:ring-ring"
                >
                  <option value="VAN">Van</option>
                  <option value="TRUCK">Truck</option>
                  <option value="MINI">Mini</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Max Capacity (kg)</label>
                <Input
                  required
                  type="number"
                  placeholder="500"
                  value={maxLoadCapacity}
                  onChange={(e) => setMaxLoadCapacity(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Initial Odometer (km)</label>
                <Input
                  required
                  type="number"
                  placeholder="0"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Acquisition Cost (INR)</label>
                <Input
                  required
                  type="number"
                  placeholder="1200000"
                  value={acquisitionCost}
                  onChange={(e) => setAcquisitionCost(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring"
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_SHOP">In Shop (Maintenance)</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
                {isPending ? 'Registering...' : 'Register Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Edit Vehicle Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the configuration or state of this vehicle in the fleet master registry.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Plate / Registration No</label>
                <Input
                  required
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Model / Name</label>
                <Input
                  required
                  value={nameModel}
                  onChange={(e) => setNameModel(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Vehicle Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as VehicleType)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring focus:ring-1 focus:ring-ring"
                >
                  <option value="VAN">Van</option>
                  <option value="TRUCK">Truck</option>
                  <option value="MINI">Mini</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Max Capacity (kg)</label>
                <Input
                  required
                  type="number"
                  value={maxLoadCapacity}
                  onChange={(e) => setMaxLoadCapacity(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Odometer Reading (km)</label>
                <Input
                  required
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Acquisition Cost (INR)</label>
                <Input
                  required
                  type="number"
                  value={acquisitionCost}
                  onChange={(e) => setAcquisitionCost(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Vehicle Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                disabled={selectedVehicle?.status === 'ON_TRIP'}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring disabled:opacity-50"
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP" disabled>On Trip (Cannot set manually)</option>
                <option value="IN_SHOP">In Shop (Maintenance)</option>
                <option value="RETIRED">Retired</option>
              </select>
              {selectedVehicle?.status === 'ON_TRIP' && (
                <p className="text-[10px] text-orange-400">Vehicle is currently dispatched on an active trip. Status cannot be modified.</p>
              )}
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete / Retire Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Delete / Retire Vehicle?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete or retire <strong>{selectedVehicle?.nameModel} ({selectedVehicle?.regNo})</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-foreground/80 space-y-2">
            <p>
              Deleting a vehicle is permanent. However, if this vehicle has trips or logs linked to it, the system will automatically <strong>Retire</strong> it instead of deleting it to preserve history and prevent data loss.
            </p>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/95 text-destructive-foreground font-semibold">
              {isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
