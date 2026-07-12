'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { Driver, LicenseCategory, DriverStatus } from '@prisma/client'
import {
  Plus, Search, UserCheck, AlertOctagon, Phone, Award, ClipboardList,
  User, CheckCircle2, XCircle, Moon, ShieldAlert, Edit, Trash2, ArrowUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createDriver, updateDriver, updateDriverStatus, deleteDriver } from '@/app/actions/drivers'
import { toast } from 'sonner'
import { isBefore, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface DriversClientProps {
  initialDrivers: Driver[]
  userRole: string
  canEdit: boolean
}

type SortField = 'name' | 'licenseNo' | 'licenseExpiry' | 'safetyScore' | 'tripsCompleted'
type SortOrder = 'asc' | 'desc'

export function DriversClient({ initialDrivers, userRole, canEdit }: DriversClientProps) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers)
  const [search, setSearch] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [licenseNo, setLicenseNo] = useState('')
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory>('LMV')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [safetyScore, setSafetyScore] = useState('100')

  const [isPending, startTransition] = useTransition()

  // Sync state with props
  React.useEffect(() => {
    setDrivers(initialDrivers)
    if (selectedDriver) {
      const updated = initialDrivers.find(d => d.id === selectedDriver.id)
      setSelectedDriver(updated || null)
    }
  }, [initialDrivers])

  const resetForm = () => {
    setName('')
    setLicenseNo('')
    setLicenseCategory('LMV')
    setLicenseExpiry('')
    setContactNumber('')
    setSafetyScore('100')
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const handleOpenEdit = (driver: Driver, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row selection when clicking Edit button
    setSelectedDriver(driver)
    setName(driver.name)
    setLicenseNo(driver.licenseNo)
    setLicenseCategory(driver.licenseCategory)
    // Format date to YYYY-MM-DD
    const dateStr = new Date(driver.licenseExpiry).toISOString().split('T')[0]
    setLicenseExpiry(dateStr)
    setContactNumber(driver.contactNumber)
    setSafetyScore(driver.safetyScore.toString())
    setIsEditOpen(true)
  }

  const handleOpenDelete = (driver: Driver, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row selection
    setSelectedDriver(driver)
    setIsDeleteOpen(true)
  }

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Handle Driver Click Selection
  const handleSelectDriver = (driver: Driver) => {
    if (selectedDriver?.id === driver.id) {
      setSelectedDriver(null) // deselect
    } else {
      setSelectedDriver(driver)
    }
  }

  // Form Submissions
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !licenseNo || !licenseExpiry || !contactNumber) {
      toast.error('Name, License No, Expiry, and Contact are required.')
      return
    }

    startTransition(async () => {
      try {
        const score = parseFloat(safetyScore)
        const newDriver = await createDriver({
          name,
          licenseNo,
          licenseCategory,
          licenseExpiry,
          contactNumber,
          safetyScore: isNaN(score) ? 100 : score,
        })
        toast.success(`Driver ${newDriver.name} added successfully.`)
        setIsAddOpen(false)
        resetForm()
      } catch (err: any) {
        toast.error(err.message || 'Failed to add driver.')
      }
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDriver) return

    if (!name || !licenseNo || !licenseExpiry || !contactNumber) {
      toast.error('All fields are required.')
      return
    }

    startTransition(async () => {
      try {
        const score = parseFloat(safetyScore)
        await updateDriver(selectedDriver.id, {
          name,
          licenseNo,
          licenseCategory,
          licenseExpiry,
          contactNumber,
          safetyScore: isNaN(score) ? 100 : score,
        })
        toast.success(`Driver details for ${name} updated successfully.`)
        setIsEditOpen(false)
        resetForm()
      } catch (err: any) {
        toast.error(err.message || 'Failed to update driver.')
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!selectedDriver) return

    startTransition(async () => {
      try {
        const res = await deleteDriver(selectedDriver.id)
        if (res.suspended) {
          toast.info('Driver has trip records. Status updated to SUSPENDED instead of deleted.')
        } else {
          toast.success('Driver removed successfully.')
        }
        setIsDeleteOpen(false)
        setSelectedDriver(null)
      } catch (err: any) {
        toast.error(err.message || 'Failed to remove driver.')
      }
    })
  }

  // Quick Status Toggle
  const handleStatusToggle = (newStatus: DriverStatus) => {
    if (!selectedDriver) return

    startTransition(async () => {
      try {
        await updateDriverStatus(selectedDriver.id, newStatus)
        toast.success(`Driver status for ${selectedDriver.name} updated to ${newStatus}.`)
      } catch (err: any) {
        toast.error(err.message || 'Failed to update driver status.')
      }
    })
  }

  // Filter and Sort Processing
  const processedDrivers = drivers
    .filter((d) => {
      return (
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.licenseNo.toLowerCase().includes(search.toLowerCase()) ||
        d.contactNumber.includes(search)
      )
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === 'name' || sortField === 'licenseNo') {
        comparison = a[sortField].localeCompare(b[sortField])
      } else if (sortField === 'licenseExpiry') {
        comparison = new Date(a.licenseExpiry).getTime() - new Date(b.licenseExpiry).getTime()
      } else {
        comparison = (a[sortField] as number) - (b[sortField] as number)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Counts
  const counts = {
    total: drivers.length,
    available: drivers.filter(d => d.status === 'AVAILABLE').length,
    onTrip: drivers.filter(d => d.status === 'ON_TRIP').length,
    offDuty: drivers.filter(d => d.status === 'OFF_DUTY').length,
    suspended: drivers.filter(d => d.status === 'SUSPENDED').length,
  }

  return (
    <div className="space-y-6">
      {/* Drivers KPI Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/80 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Drivers</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-foreground">{counts.total}</span>
              <span className="text-xs text-muted-foreground">registered</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Available</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-green-400">{counts.available}</span>
              <span className="text-xs text-green-500/70">on duty</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">On Trip</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-blue-400">{counts.onTrip}</span>
              <span className="text-xs text-blue-500/70">driving</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-500/5 border-gray-500/10 shadow-md">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Off Duty</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-gray-400">{counts.offDuty}</span>
              <span className="text-xs text-gray-500/70">resting</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/10 shadow-md col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Suspended</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-red-400">{counts.suspended}</span>
              <span className="text-xs text-red-500/70">restricted</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Name, License No, Contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full bg-background"
          />
        </div>

        {canEdit && (
          <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 shadow-lg bg-primary hover:bg-primary/95">
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        )}
      </div>

      {/* Driver List Table */}
      <Card className="border border-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-4 align-middle">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-foreground">
                    Driver Name <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">
                  <button onClick={() => handleSort('licenseNo')} className="flex items-center gap-1 hover:text-foreground">
                    License No. <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">Category</th>
                <th className="p-4 align-middle">
                  <button onClick={() => handleSort('licenseExpiry')} className="flex items-center gap-1 hover:text-foreground">
                    License Expiry <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">Contact</th>
                <th className="p-4 align-middle text-center">
                  <button onClick={() => handleSort('safetyScore')} className="flex items-center gap-1 mx-auto hover:text-foreground">
                    Safety Score <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle text-center">
                  <button onClick={() => handleSort('tripsCompleted')} className="flex items-center gap-1 mx-auto hover:text-foreground">
                    Trips Done <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="p-4 align-middle">Status</th>
                {canEdit && <th className="p-4 align-middle text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {processedDrivers.map((driver) => {
                const today = startOfDay(new Date())
                const expiryDate = startOfDay(new Date(driver.licenseExpiry))
                const isExpired = isBefore(expiryDate, today)

                return (
                  <tr
                    key={driver.id}
                    onClick={() => handleSelectDriver(driver)}
                    className={cn(
                      'border-b border-border hover:bg-muted/10 cursor-pointer transition-colors',
                      selectedDriver?.id === driver.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    )}
                  >
                    <td className="p-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {driver.name[0].toUpperCase()}
                        </div>
                        {driver.name}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{driver.licenseNo}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-muted border border-border text-foreground rounded font-semibold text-xs">
                        {driver.licenseCategory}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className={cn('text-xs font-semibold', isExpired ? 'text-red-400 font-bold' : 'text-foreground/80')}>
                          {expiryDate.toLocaleDateString()}
                        </span>
                        {isExpired && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-red-400 font-bold uppercase tracking-wider mt-0.5">
                            <ShieldAlert className="h-2.5 w-2.5" /> Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{driver.contactNumber}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center font-bold text-sm bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded">
                        {driver.safetyScore}
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold text-foreground">{driver.tripsCompleted}</td>
                    <td className="p-4">
                      <StatusBadge status={driver.status} />
                    </td>
                    {canEdit && (
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => handleOpenEdit(driver, e)}
                            title="Edit Driver"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => handleOpenDelete(driver, e)}
                            disabled={driver.status === 'ON_TRIP'}
                            title={driver.status === 'ON_TRIP' ? 'Cannot remove driver currently on active trip' : 'Delete Driver'}
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
              {processedDrivers.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="p-8 text-center text-muted-foreground">
                    No drivers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* QUICK STATUS TOGGLE BAR (BELOW TABLE FOR SELECTED DRIVER) */}
      {selectedDriver && (
        <Card className="border border-primary/20 bg-primary/[0.02] backdrop-blur-md shadow-lg animate-in fade-in-50 duration-200">
          <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5 text-primary" /> Manage Status: {selectedDriver.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Current status is <span className="font-semibold text-foreground">{selectedDriver.status.replace('_', ' ')}</span>. Category: {selectedDriver.licenseCategory} | License No: {selectedDriver.licenseNo}
              </p>
            </div>
            
            {canEdit ? (
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button
                  size="sm"
                  variant={selectedDriver.status === 'AVAILABLE' ? 'default' : 'outline'}
                  onClick={() => handleStatusToggle('AVAILABLE')}
                  disabled={isPending}
                  className={cn(
                    'flex-1 md:flex-initial font-semibold text-xs',
                    selectedDriver.status === 'AVAILABLE' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : 'border-green-600/30 text-green-500 hover:bg-green-500/10'
                  )}
                >
                  Available
                </Button>
                <Button
                  size="sm"
                  variant={selectedDriver.status === 'ON_TRIP' ? 'default' : 'outline'}
                  onClick={() => handleStatusToggle('ON_TRIP')}
                  disabled={isPending}
                  className={cn(
                    'flex-1 md:flex-initial font-semibold text-xs',
                    selectedDriver.status === 'ON_TRIP' ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' : 'border-blue-600/30 text-blue-500 hover:bg-blue-500/10'
                  )}
                >
                  On Trip
                </Button>
                <Button
                  size="sm"
                  variant={selectedDriver.status === 'OFF_DUTY' ? 'default' : 'outline'}
                  onClick={() => handleStatusToggle('OFF_DUTY')}
                  disabled={isPending}
                  className={cn(
                    'flex-1 md:flex-initial font-semibold text-xs',
                    selectedDriver.status === 'OFF_DUTY' ? 'bg-gray-600 hover:bg-gray-700 text-white border-transparent' : 'border-gray-500/30 text-gray-400 hover:bg-gray-500/10'
                  )}
                >
                  Off Duty
                </Button>
                <Button
                  size="sm"
                  variant={selectedDriver.status === 'SUSPENDED' ? 'default' : 'outline'}
                  onClick={() => handleStatusToggle('SUSPENDED')}
                  disabled={isPending}
                  className={cn(
                    'flex-1 md:flex-initial font-semibold text-xs',
                    selectedDriver.status === 'SUSPENDED' ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : 'border-red-600/30 text-red-500 hover:bg-red-500/10'
                  )}
                >
                  Suspended
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">You do not have permissions to modify driver status.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Driver Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Add New Driver Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a driver profile. Expiry date and contact format will be validated.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <Input
                  required
                  placeholder="e.g. Alex Jones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">License Number</label>
                <Input
                  required
                  placeholder="e.g. DL-12345678"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">License Category</label>
                <select
                  value={licenseCategory}
                  onChange={(e) => setLicenseCategory(e.target.value as LicenseCategory)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring"
                >
                  <option value="LMV">LMV (Light Motor Vehicle)</option>
                  <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">License Expiry Date</label>
                <Input
                  required
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Contact Number</label>
                <Input
                  required
                  placeholder="10 digit number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Safety Score (0 - 100)</label>
                <Input
                  type="number"
                  placeholder="100"
                  min="0"
                  max="100"
                  value={safetyScore}
                  onChange={(e) => setSafetyScore(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
                {isPending ? 'Adding...' : 'Add Driver'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Edit Driver Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update configuration values for {name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">License Number</label>
                <Input
                  required
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">License Category</label>
                <select
                  value={licenseCategory}
                  onChange={(e) => setLicenseCategory(e.target.value as LicenseCategory)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-hidden focus:border-ring"
                >
                  <option value="LMV">LMV</option>
                  <option value="HMV">HMV</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">License Expiry Date</label>
                <Input
                  required
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Contact Number</label>
                <Input
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Safety Score</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={safetyScore}
                  onChange={(e) => setSafetyScore(e.target.value)}
                  className="bg-background"
                />
              </div>
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

      {/* Delete / Suspend Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Remove Driver Profile?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove <strong>{selectedDriver?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-foreground/80 space-y-2">
            <p>
              Removing a driver profile is permanent. However, if this driver is linked to trip history or logs, the system will automatically update their status to <strong>Suspended</strong> instead of deleting them.
            </p>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/95 text-destructive-foreground font-semibold">
              {isPending ? 'Confirming...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
