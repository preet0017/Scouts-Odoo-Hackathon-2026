import { z } from 'zod'
import { VehicleType, LicenseCategory } from '@prisma/client'

// ── Auth ──────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
})

// ── Vehicle ───────────────────────────────────────────────
export const vehicleSchema = z.object({
  regNo:           z.string().min(1, 'Registration number required'),
  nameModel:       z.string().min(1, 'Name/Model required'),
  type:            z.nativeEnum(VehicleType),
  maxLoadCapacity: z.number().positive('Capacity must be positive'),
  odometer:        z.number().min(0),
  acquisitionCost: z.number().positive(),
})

// ── Driver ────────────────────────────────────────────────
export const driverSchema = z.object({
  name:            z.string().min(1),
  licenseNo:       z.string().min(1),
  licenseCategory: z.nativeEnum(LicenseCategory),
  licenseExpiry:   z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  contactNumber:   z.string().min(10),
  safetyScore:     z.number().min(0).max(100).optional(),
})

// ── Trip ──────────────────────────────────────────────────
export const createTripSchema = z.object({
  source:          z.string().min(1),
  destination:     z.string().min(1),
  vehicleId:       z.string().cuid(),
  driverId:        z.string().cuid(),
  cargoWeight:     z.number().positive(),
  plannedDistance: z.number().positive(),
  revenue:         z.number().optional(),
})

export const completeTripSchema = z.object({
  tripId:        z.string().cuid(),
  finalOdometer: z.number().positive(),
  fuelConsumed:  z.number().positive(),
})

// ── Maintenance ───────────────────────────────────────────
export const maintenanceSchema = z.object({
  vehicleId:   z.string().cuid(),
  serviceType: z.string().min(1),
  cost:        z.number().positive(),
  date:        z.string(),
  notes:       z.string().optional(),
})

// ── Fuel Log ──────────────────────────────────────────────
export const fuelLogSchema = z.object({
  vehicleId: z.string().cuid(),
  tripId:    z.string().cuid().optional(),
  date:      z.string(),
  liters:    z.number().positive(),
  cost:      z.number().positive(),
})

// ── Expense ───────────────────────────────────────────────
export const expenseSchema = z.object({
  vehicleId: z.string().cuid(),
  tripId:    z.string().cuid().optional(),
  toll:      z.number().min(0),
  other:     z.number().min(0),
})
