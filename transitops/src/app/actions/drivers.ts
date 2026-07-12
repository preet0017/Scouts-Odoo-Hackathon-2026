'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { DriverStatus, LicenseCategory } from '@prisma/client'
import { z } from 'zod'

const driverActionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  licenseNo: z.string().min(1, 'License number is required'),
  licenseCategory: z.nativeEnum(LicenseCategory),
  licenseExpiry: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  safetyScore: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(DriverStatus).optional(),
})

export async function createDriver(data: z.infer<typeof driverActionSchema>) {
  const validated = driverActionSchema.parse(data)

  // Check unique license number
  const existing = await prisma.driver.findUnique({
    where: { licenseNo: validated.licenseNo },
  })

  if (existing) {
    throw new Error(`Driver with license number ${validated.licenseNo} already exists.`)
  }

  const driver = await prisma.driver.create({
    data: {
      name: validated.name,
      licenseNo: validated.licenseNo,
      licenseCategory: validated.licenseCategory,
      licenseExpiry: new Date(validated.licenseExpiry),
      contactNumber: validated.contactNumber,
      safetyScore: validated.safetyScore ?? 100,
      status: validated.status || DriverStatus.AVAILABLE,
    },
  })

  revalidatePath('/drivers')
  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return driver
}

export async function updateDriver(id: string, data: Partial<z.infer<typeof driverActionSchema>>) {
  const validated = driverActionSchema.partial().parse(data)

  if (validated.licenseNo) {
    const existing = await prisma.driver.findFirst({
      where: {
        licenseNo: validated.licenseNo,
        id: { not: id },
      },
    })
    if (existing) {
      throw new Error(`Another driver with license number ${validated.licenseNo} already exists.`)
    }
  }

  const updateData: any = { ...validated }
  if (validated.licenseExpiry) {
    updateData.licenseExpiry = new Date(validated.licenseExpiry)
  }

  const driver = await prisma.driver.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/drivers')
  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return driver
}

export async function updateDriverStatus(id: string, status: DriverStatus) {
  const driver = await prisma.driver.update({
    where: { id },
    data: { status },
  })

  revalidatePath('/drivers')
  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return driver
}

export async function deleteDriver(id: string) {
  // Check if driver has trips
  const tripsCount = await prisma.trip.count({
    where: { driverId: id },
  })

  if (tripsCount > 0) {
    // If has trips, suspend them instead of deleting to preserve DB links
    const driver = await prisma.driver.update({
      where: { id },
      data: { status: DriverStatus.SUSPENDED },
    })
    revalidatePath('/drivers')
    revalidatePath('/trips')
    revalidatePath('/dashboard')
    return { success: true, suspended: true, driver }
  }

  await prisma.driver.delete({
    where: { id },
  })

  revalidatePath('/drivers')
  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return { success: true, suspended: false }
}
