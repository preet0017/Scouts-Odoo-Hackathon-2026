'use client'

import { useState } from 'react'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SlidersHorizontal } from 'lucide-react'

interface Props {
  onFilter: (type: string, status: string, region: string) => void
}

export function DashboardFilters() {
  const [vehicleType, setVehicleType] = useState('ALL')
  const [status,      setStatus]      = useState('ALL')
  const [region,      setRegion]      = useState('ALL')

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="font-medium">Filters</span>
      </div>

      <Select value={vehicleType} onValueChange={setVehicleType}>
        <SelectTrigger className="w-40 h-8 text-sm">
          <SelectValue placeholder="Vehicle Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="VAN">Van</SelectItem>
          <SelectItem value="TRUCK">Truck</SelectItem>
          <SelectItem value="MINI">Mini</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40 h-8 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="AVAILABLE">Available</SelectItem>
          <SelectItem value="ON_TRIP">On Trip</SelectItem>
          <SelectItem value="IN_SHOP">In Shop</SelectItem>
          <SelectItem value="RETIRED">Retired</SelectItem>
        </SelectContent>
      </Select>

      <Select value={region} onValueChange={setRegion}>
        <SelectTrigger className="w-40 h-8 text-sm">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Regions</SelectItem>
          <SelectItem value="NORTH">North</SelectItem>
          <SelectItem value="SOUTH">South</SelectItem>
          <SelectItem value="EAST">East</SelectItem>
          <SelectItem value="WEST">West</SelectItem>
        </SelectContent>
      </Select>

      {(vehicleType !== 'ALL' || status !== 'ALL' || region !== 'ALL') && (
        <button
          onClick={() => { setVehicleType('ALL'); setStatus('ALL'); setRegion('ALL') }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
