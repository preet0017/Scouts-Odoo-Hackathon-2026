'use server'

import { prisma } from '@/lib/prisma'
import { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '@prisma/client'
import { isAfter } from 'date-fns'

// ─────────────────────────────────────────────────────────
// ELIGIBILITY QUERIES
// ─────────────────────────────────────────────────────────

/** Returns only vehicles that can be dispatched (rules 2, 4) */
export async function getEligibleVehicles() {
  return prisma.vehicle.findMany({
    where: { status: VehicleStatus.AVAILABLE },
    orderBy: { nameModel: 'asc' },
  })
}

/** Returns only drivers that can be dispatched (rules 3, 4) */
export async function getEligibleDrivers() {
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.AVAILABLE,
      licenseExpiry: { gte: new Date() },
    },
    orderBy: { name: 'asc' },
  })
}

// ─────────────────────────────────────────────────────────
// TRIP TRANSITIONS
// ─────────────────────────────────────────────────────────

/** Draft → Dispatched (enforces rules 4, 5, 6) */
export async function dispatchTrip(tripId: string) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  })

  if (trip.status !== TripStatus.DRAFT) {
    throw new Error(`Trip is ${trip.status}, not DRAFT`)
  }

  if (trip.vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new Error(`Vehicle ${trip.vehicle.nameModel} is ${trip.vehicle.status} — not available for dispatch`)
  }

  if (trip.driver.status !== DriverStatus.AVAILABLE) {
    throw new Error(`Driver ${trip.driver.name} is ${trip.driver.status} — cannot be dispatched`)
  }
  if (!isAfter(new Date(trip.driver.licenseExpiry), new Date())) {
    throw new Error(`Driver ${trip.driver.name} has an expired license`)
  }

  if (trip.cargoWeight > trip.vehicle.maxLoadCapacity) {
    const excess = trip.cargoWeight - trip.vehicle.maxLoadCapacity
    throw new Error(
      `Capacity exceeded by ${excess} kg — dispatch blocked. ` +
      `Vehicle capacity: ${trip.vehicle.maxLoadCapacity} kg, Cargo: ${trip.cargoWeight} kg`
    )
  }

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.DISPATCHED },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.ON_TRIP },
    }),
    prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.ON_TRIP },
    }),
  ])

  return { success: true }
}

/** Dispatched → Completed (rule 7) */
export async function completeTrip(
  tripId: string,
  finalOdometer: number,
  fuelConsumed: number
) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { vehicle: true },
  })

  if (trip.status !== TripStatus.DISPATCHED) {
    throw new Error(`Trip is ${trip.status}, not DISPATCHED`)
  }

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.COMPLETED, finalOdometer, fuelConsumed },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.AVAILABLE, odometer: finalOdometer },
    }),
    prisma.driver.update({
      where: { id: trip.driverId },
      data: {
        status: DriverStatus.AVAILABLE,
        tripsCompleted: { increment: 1 },
      },
    }),
    prisma.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        tripId,
        date: new Date(),
        liters: fuelConsumed,
        cost: 0,
      },
    }),
  ])

  return { success: true }
}

/** Draft/Dispatched → Cancelled (rule 8) */
export async function cancelTrip(tripId: string) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
  })

  if (trip.status === TripStatus.COMPLETED) {
    throw new Error('Cannot cancel a completed trip')
  }

  const wasDispatched = trip.status === TripStatus.DISPATCHED

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.CANCELLED },
    }),
    ...(wasDispatched
      ? [
        prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        }),
        prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE },
        }),
      ]
      : []),
  ])

  return { success: true }
}

// ─────────────────────────────────────────────────────────
// MAINTENANCE TRANSITIONS
// ─────────────────────────────────────────────────────────

/** Create maintenance record → vehicle becomes IN_SHOP (rule 9) */
export async function openMaintenance(data: {
  vehicleId: string
  serviceType: string
  cost: number
  date: Date
  notes?: string
}) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: data.vehicleId },
  })

  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new Error('Cannot open maintenance on a vehicle that is On Trip')
  }
  if (vehicle.status === VehicleStatus.RETIRED) {
    throw new Error('Cannot open maintenance on a Retired vehicle')
  }

  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: { ...data, status: MaintenanceStatus.ACTIVE },
    }),
    prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: VehicleStatus.IN_SHOP },
    }),
  ])

  return log
}

/** Close maintenance → vehicle returns to AVAILABLE (rule 10) */
export async function closeMaintenance(maintenanceId: string) {
  const log = await prisma.maintenanceLog.findUniqueOrThrow({
    where: { id: maintenanceId },
    include: { vehicle: true },
  })

  if (log.status !== MaintenanceStatus.ACTIVE) {
    throw new Error('Maintenance record is already closed')
  }

  const nextVehicleStatus =
    log.vehicle.status === VehicleStatus.RETIRED
      ? VehicleStatus.RETIRED
      : VehicleStatus.AVAILABLE

  await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id: maintenanceId },
      data: { status: MaintenanceStatus.COMPLETED },
    }),
    prisma.vehicle.update({
      where: { id: log.vehicleId },
      data: { status: nextVehicleStatus },
    }),
  ])

  return { success: true }
}

/** Add attachment to a maintenance record */
export async function addMaintenanceAttachment(maintenanceId: string, attachment: string) {
  const log = await prisma.maintenanceLog.findUniqueOrThrow({
    where: { id: maintenanceId },
  })
  const updated = log.attachments ? `${log.attachments}, ${attachment}` : attachment
  return prisma.maintenanceLog.update({
    where: { id: maintenanceId },
    data: { attachments: updated },
  })
}
