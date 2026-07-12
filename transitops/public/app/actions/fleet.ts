'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { VehicleStatus, VehicleType } from '@prisma/client'
import { z } from 'zod'

const vehicleActionSchema = z.object({
  regNo: z.string().min(1, 'Registration number required'),
  nameModel: z.string().min(1, 'Name/Model required'),
  type: z.nativeEnum(VehicleType),
  maxLoadCapacity: z.number().positive('Capacity must be positive'),
  odometer: z.number().min(0, 'Odometer must be non-negative'),
  acquisitionCost: z.number().positive('Acquisition cost must be positive'),
  status: z.nativeEnum(VehicleStatus).optional(),
})

export async function createVehicle(data: z.infer<typeof vehicleActionSchema>) {
  const validated = vehicleActionSchema.parse(data)

  // Check unique registration number
  const existing = await prisma.vehicle.findUnique({
    where: { regNo: validated.regNo },
  })

  if (existing) {
    throw new Error(`Vehicle with registration number ${validated.regNo} already exists.`)
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      regNo: validated.regNo,
      nameModel: validated.nameModel,
      type: validated.type,
      maxLoadCapacity: validated.maxLoadCapacity,
      odometer: validated.odometer,
      acquisitionCost: validated.acquisitionCost,
      status: validated.status || VehicleStatus.AVAILABLE,
    },
  })

  revalidatePath('/fleet')
  revalidatePath('/dashboard')
  return vehicle
}

export async function updateVehicle(id: string, data: Partial<z.infer<typeof vehicleActionSchema>>) {
  const validated = vehicleActionSchema.partial().parse(data)

  if (validated.regNo) {
    const existing = await prisma.vehicle.findFirst({
      where: {
        regNo: validated.regNo,
        id: { not: id },
      },
    })
    if (existing) {
      throw new Error(`Another vehicle with registration number ${validated.regNo} already exists.`)
    }
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: validated,
  })

  revalidatePath('/fleet')
  revalidatePath('/dashboard')
  return vehicle
}

export async function deleteVehicle(id: string) {
  // Check if vehicle has trips
  const tripsCount = await prisma.trip.count({
    where: { vehicleId: id },
  })

  if (tripsCount > 0) {
    // If it has trips, let's mark it as RETIRED instead of hard deleting to preserve referential integrity
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.RETIRED },
    })
    revalidatePath('/fleet')
    revalidatePath('/dashboard')
    return { success: true, retired: true, vehicle }
  }

  await prisma.vehicle.delete({
    where: { id },
  })

  revalidatePath('/fleet')
  revalidatePath('/dashboard')
  return { success: true, retired: false }
}
