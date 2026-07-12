'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Fuel, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { createFuelLog, createExpense } from '@/app/actions/fuel'
import { format } from 'date-fns'

interface Vehicle { id: string; nameModel: string; regNo: string }
interface Trip    { id: string; source: string; destination: string; status: string }

interface FuelLog {
  id: string
  vehicle: Vehicle
  trip: Trip | null
  date: Date
  liters: number
  cost: number
}

interface Expense {
  id: string
  vehicle: Vehicle
  trip: Trip | null
  toll: number
  other: number
  maintenanceLinked: number
  total: number
}

interface Props {
  vehicles:     Vehicle[]
  trips:        Trip[]
  fuelLogs:     FuelLog[]
  expenses:     Expense[]
  totalFuel:    number
  totalMaint:   number
}

export function FuelClient({ vehicles, trips, fuelLogs, expenses, totalFuel, totalMaint }: Props) {
  const router = useRouter()
  const [fuelOpen,    setFuelOpen]    = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [loading,     setLoading]     = useState(false)

  // Fuel log form state
  const [fVehicle, setFVehicle] = useState('')
  const [fTrip,    setFTrip]    = useState('')
  const [fDate,    setFDate]    = useState(new Date().toISOString().slice(0, 10))
  const [fLiters,  setFLiters]  = useState('')
  const [fCost,    setFCost]    = useState('')

  // Expense form state
  const [eVehicle, setEVehicle] = useState('')
  const [eTrip,    setETrip]    = useState('')
  const [eToll,    setEToll]    = useState('')
  const [eOther,   setEOther]   = useState('')

  async function submitFuelLog() {
    if (!fVehicle || !fDate || !fLiters || !fCost) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      await createFuelLog({
        vehicleId: fVehicle,
        tripId:    fTrip || undefined,
        date:      fDate,
        liters:    parseFloat(fLiters),
        cost:      parseFloat(fCost),
      })
      toast.success('Fuel log recorded')
      setFuelOpen(false)
      setFVehicle(''); setFTrip(''); setFLiters(''); setFCost('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to log fuel')
    } finally {
      setLoading(false)
    }
  }

  async function submitExpense() {
    if (!eVehicle) {
      toast.error('Vehicle is required')
      return
    }
    setLoading(true)
    try {
      await createExpense({
        vehicleId: eVehicle,
        tripId:    eTrip || undefined,
        toll:      parseFloat(eToll) || 0,
        other:     parseFloat(eOther) || 0,
      })
      toast.success('Expense recorded')
      setExpenseOpen(false)
      setEVehicle(''); setETrip(''); setEToll(''); setEOther('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to record expense')
    } finally {
      setLoading(false)
    }
  }

  const totalOp = totalFuel + totalMaint

  return (
    <div className="space-y-8">

      {/* ── FUEL LOGS ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-base">Fuel Logs</CardTitle>
          </div>
          <Dialog open={fuelOpen} onOpenChange={setFuelOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
              <Plus className="h-4 w-4" /> Log Fuel
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Fuel Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Vehicle <span className="text-destructive">*</span></Label>
                  <Select value={fVehicle} onValueChange={(v) => setFVehicle(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.nameModel} ({v.regNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trip (optional)</Label>
                  <Select value={fTrip} onValueChange={(v) => setFTrip(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Link to trip" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {trips.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.source} → {t.destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Liters <span className="text-destructive">*</span></Label>
                    <Input type="number" min="0" placeholder="0.00" value={fLiters} onChange={e => setFLiters(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cost (₹) <span className="text-destructive">*</span></Label>
                    <Input type="number" min="0" placeholder="0.00" value={fCost} onChange={e => setFCost(e.target.value)} />
                  </div>
                </div>
                <Button onClick={submitFuelLog} disabled={loading} className="w-full">
                  {loading ? 'Saving…' : 'Save Fuel Log'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Liters</TableHead>
                <TableHead className="text-right">Fuel Cost (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No fuel logs yet — click "+ Log Fuel" to add one
                  </TableCell>
                </TableRow>
              ) : fuelLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.vehicle.nameModel}
                    <span className="ml-1 text-xs text-muted-foreground">({log.vehicle.regNo})</span>
                  </TableCell>
                  <TableCell>{format(new Date(log.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-right">{log.liters.toFixed(1)} L</TableCell>
                  <TableCell className="text-right font-mono">₹{log.cost.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── OTHER EXPENSES ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-base">Other Expenses</CardTitle>
          </div>
          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
              <Plus className="h-4 w-4" /> Add Expense
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Vehicle <span className="text-destructive">*</span></Label>
                  <Select value={eVehicle} onValueChange={(v) => setEVehicle(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.nameModel} ({v.regNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trip (optional)</Label>
                  <Select value={eTrip} onValueChange={(v) => setETrip(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Link to trip" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {trips.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.source} → {t.destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Toll (₹)</Label>
                    <Input type="number" min="0" placeholder="0" value={eToll} onChange={e => setEToll(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Other (₹)</Label>
                    <Input type="number" min="0" placeholder="0" value={eOther} onChange={e => setEOther(e.target.value)} />
                  </div>
                </div>
                <Button onClick={submitExpense} disabled={loading} className="w-full">
                  {loading ? 'Saving…' : 'Save Expense'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Toll (₹)</TableHead>
                <TableHead className="text-right">Other (₹)</TableHead>
                <TableHead className="text-right">Maint. Linked (₹)</TableHead>
                <TableHead className="text-right">Total (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No expenses recorded yet
                  </TableCell>
                </TableRow>
              ) : expenses.map(exp => (
                <TableRow key={exp.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {exp.trip ? `${exp.trip.source} → ${exp.trip.destination}` : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{exp.vehicle.nameModel}</TableCell>
                  <TableCell className="text-right font-mono">₹{exp.toll.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">₹{exp.other.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-orange-400">₹{exp.maintenanceLinked.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">₹{exp.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── TOTAL OPERATIONAL COST FOOTER ── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-1">
                Total Operational Cost (Auto-Calculated)
              </p>
              <p className="text-4xl font-bold text-foreground">₹{totalOp.toLocaleString()}</p>
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-muted-foreground">Fuel</p>
                <p className="text-xl font-semibold text-orange-400">₹{totalFuel.toLocaleString()}</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-muted-foreground">Maintenance</p>
                <p className="text-xl font-semibold text-blue-400">₹{totalMaint.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
