'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const fuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle required'),
  tripId:    z.string().optional(),
  date:      z.string().min(1, 'Date required'),
  liters:    z.number().positive('Liters must be positive'),
  cost:      z.number().positive('Cost must be positive'),
})

const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle required'),
  tripId:    z.string().optional(),
  toll:      z.number().min(0).default(0),
  other:     z.number().min(0).default(0),
})

export async function createFuelLog(data: z.infer<typeof fuelLogSchema>) {
  const validated = fuelLogSchema.parse(data)
  const log = await prisma.fuelLog.create({
    data: {
      vehicleId: validated.vehicleId,
      tripId:    validated.tripId || null,
      date:      new Date(validated.date),
      liters:    validated.liters,
      cost:      validated.cost,
    },
  })
  revalidatePath('/fuel')
  revalidatePath('/analytics')
  return log
}

export async function createExpense(data: z.infer<typeof expenseSchema>) {
  const validated = expenseSchema.parse(data)

  // Pull linked maintenance cost for this vehicle
  const maintCost = await prisma.maintenanceLog.aggregate({
    where:  { vehicleId: validated.vehicleId },
    _sum:   { cost: true },
  })
  const maintenanceLinked = maintCost._sum.cost ?? 0

  const expense = await prisma.expense.create({
    data: {
      vehicleId:         validated.vehicleId,
      tripId:            validated.tripId || null,
      toll:              validated.toll,
      other:             validated.other,
      maintenanceLinked,
      total:             validated.toll + validated.other,
    },
  })
  revalidatePath('/fuel')
  revalidatePath('/analytics')
  return expense
}
