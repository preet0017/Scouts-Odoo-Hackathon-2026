'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TripStatus } from '@prisma/client'
import { z } from 'zod'
import {
  dispatchTrip as baseDispatchTrip,
  completeTrip as baseCompleteTrip,
  cancelTrip as baseCancelTrip
} from '@/lib/transitions'

const tripActionSchema = z.object({
  source: z.string().min(1, 'Source required'),
  destination: z.string().min(1, 'Destination required'),
  vehicleId: z.string().min(1, 'Vehicle required'),
  driverId: z.string().min(1, 'Driver required'),
  cargoWeight: z.number().positive('Cargo weight must be positive'),
  plannedDistance: z.number().positive('Planned distance must be positive'),
  revenue: z.number().nonnegative('Revenue must be non-negative').optional(),
})

export async function createTrip(data: z.infer<typeof tripActionSchema>) {
  const validated = tripActionSchema.parse(data)

  // Validate vehicle exists and is eligible (not retired, not in shop, not on trip)
  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: validated.vehicleId },
  })
  if (vehicle.status === 'RETIRED' || vehicle.status === 'IN_SHOP') {
    throw new Error(`Vehicle is in ${vehicle.status} status and cannot be assigned.`)
  }
  if (vehicle.status === 'ON_TRIP') {
    throw new Error('Vehicle is currently on another active trip.')
  }

  // Validate cargo weight
  if (validated.cargoWeight > vehicle.maxLoadCapacity) {
    throw new Error(
      `Cargo weight (${validated.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoadCapacity} kg).`
    )
  }

  // Validate driver exists and is eligible
  const driver = await prisma.driver.findUniqueOrThrow({
    where: { id: validated.driverId },
  })
  if (driver.status === 'SUSPENDED') {
    throw new Error('Driver is suspended and cannot be assigned.')
  }
  if (driver.status === 'ON_TRIP') {
    throw new Error('Driver is currently on another active trip.')
  }
  if (new Date(driver.licenseExpiry) <= new Date()) {
    throw new Error('Driver driving license is expired.')
  }

  const trip = await prisma.trip.create({
    data: {
      source: validated.source,
      destination: validated.destination,
      vehicleId: validated.vehicleId,
      driverId: validated.driverId,
      cargoWeight: validated.cargoWeight,
      plannedDistance: validated.plannedDistance,
      revenue: validated.revenue || 0,
      status: TripStatus.DRAFT,
    },
  })

  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return trip
}

export async function updateTrip(id: string, data: Partial<z.infer<typeof tripActionSchema>>) {
  const validated = tripActionSchema.partial().parse(data)

  const existingTrip = await prisma.trip.findUniqueOrThrow({
    where: { id },
  })

  if (existingTrip.status !== TripStatus.DRAFT) {
    throw new Error('Only DRAFT trips can be updated.')
  }

  // If vehicle is updated, validate new vehicle
  if (validated.vehicleId && validated.vehicleId !== existingTrip.vehicleId) {
    const vehicle = await prisma.vehicle.findUniqueOrThrow({
      where: { id: validated.vehicleId },
    })
    if (vehicle.status === 'RETIRED' || vehicle.status === 'IN_SHOP') {
      throw new Error(`Vehicle is in ${vehicle.status} status and cannot be assigned.`)
    }
    if (vehicle.status === 'ON_TRIP') {
      throw new Error('Vehicle is currently on another active trip.')
    }
    const weightToCheck = validated.cargoWeight ?? existingTrip.cargoWeight
    if (weightToCheck > vehicle.maxLoadCapacity) {
      throw new Error(
        `Cargo weight (${weightToCheck} kg) exceeds new vehicle maximum capacity (${vehicle.maxLoadCapacity} kg).`
      )
    }
  } else if (validated.cargoWeight && !validated.vehicleId) {
    // Check weight against current vehicle
    const vehicle = await prisma.vehicle.findUniqueOrThrow({
      where: { id: existingTrip.vehicleId },
    })
    if (validated.cargoWeight > vehicle.maxLoadCapacity) {
      throw new Error(
        `Cargo weight (${validated.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoadCapacity} kg).`
      )
    }
  }

  // If driver is updated, validate new driver
  if (validated.driverId && validated.driverId !== existingTrip.driverId) {
    const driver = await prisma.driver.findUniqueOrThrow({
      where: { id: validated.driverId },
    })
    if (driver.status === 'SUSPENDED') {
      throw new Error('Driver is suspended and cannot be assigned.')
    }
    if (driver.status === 'ON_TRIP') {
      throw new Error('Driver is currently on another active trip.')
    }
    if (new Date(driver.licenseExpiry) <= new Date()) {
      throw new Error('Driver driving license is expired.')
    }
  }

  const trip = await prisma.trip.update({
    where: { id },
    data: validated,
  })

  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return trip
}

export async function deleteTrip(id: string) {
  const existingTrip = await prisma.trip.findUniqueOrThrow({
    where: { id },
  })

  if (existingTrip.status !== TripStatus.DRAFT && existingTrip.status !== TripStatus.CANCELLED) {
    throw new Error('Only DRAFT or CANCELLED trips can be deleted.')
  }

  await prisma.trip.delete({
    where: { id },
  })

  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function dispatchTripAction(tripId: string) {
  const res = await baseDispatchTrip(tripId)
  revalidatePath('/trips')
  revalidatePath('/fleet')
  revalidatePath('/dashboard')
  return res
}

export async function completeTripAction(
  tripId: string,
  finalOdometer: number,
  fuelConsumed: number
) {
  const res = await baseCompleteTrip(tripId, finalOdometer, fuelConsumed)
  revalidatePath('/trips')
  revalidatePath('/fleet')
  revalidatePath('/dashboard')
  return res
}

export async function cancelTripAction(tripId: string) {
  const res = await baseCancelTrip(tripId)
  revalidatePath('/trips')
  revalidatePath('/fleet')
  revalidatePath('/dashboard')
  return res
}
