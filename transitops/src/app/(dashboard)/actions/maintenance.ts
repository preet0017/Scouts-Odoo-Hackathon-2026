'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { openMaintenance, closeMaintenance } from '@/lib/transitions'
import { z } from 'zod'

const maintenanceSchema = z.object({
  vehicleId:   z.string().min(1, 'Vehicle is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  cost:        z.coerce.number().min(0, 'Cost must be positive'),
  date:        z.string().min(1, 'Date is required'),
  notes:       z.string().optional(),
})

export async function createMaintenanceRecord(formData: {
  vehicleId: string
  serviceType: string
  cost: number
  date: string
  notes?: string
}) {
  const parsed = maintenanceSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  try {
    const log = await openMaintenance({
      vehicleId:   parsed.data.vehicleId,
      serviceType: parsed.data.serviceType,
      cost:        parsed.data.cost,
      date:        new Date(parsed.data.date),
      notes:       parsed.data.notes,
    })

    revalidatePath('/maintenance')
    revalidatePath('/fleet')
    revalidatePath('/dashboard')
    return { success: true, log }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function closeMaintenanceRecord(maintenanceId: string) {
  try {
    await closeMaintenance(maintenanceId)
    revalidatePath('/maintenance')
    revalidatePath('/fleet')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getMaintenanceLogs() {
  return prisma.maintenanceLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: { vehicle: true },
  })
}

export async function getAllVehicles() {
  return prisma.vehicle.findMany({
    orderBy: { nameModel: 'asc' },
    select: {
      id: true,
      nameModel: true,
      regNo: true,
      status: true,
    }
  })
}