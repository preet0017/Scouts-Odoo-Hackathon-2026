'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  depotName:    z.string().min(1),
  currency:     z.string().min(1),
  distanceUnit: z.string().min(1),
})

export async function saveSettings(data: {
  depotName: string
  currency: string
  distanceUnit: string
}) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Invalid settings data' }
  }

  await prisma.settings.upsert({
    where:  { id: 'global' },
    update: parsed.data,
    create: { id: 'global', ...parsed.data },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function getSettings() {
  const settings = await prisma.settings.findFirst()
  return settings ?? {
    depotName:    'Gandhinagar Depot G24',
    currency:     'INR (Rs)',
    distanceUnit: 'Kilometers',
  }
}
