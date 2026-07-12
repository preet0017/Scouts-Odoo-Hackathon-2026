'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Only ADMIN can call these actions
async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') throw new Error('Unauthorized — Admin only')
  return session
}

// Generate a readable random password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const symbols = '@#$!'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  password += symbols[Math.floor(Math.random() * symbols.length)]
  password += Math.floor(Math.random() * 90 + 10)
  return password
}

const createEmployeeSchema = z.object({
  name:  z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role:  z.nativeEnum(Role),
})

// Create employee — returns plain password ONCE for admin to share
export async function createEmployee(formData: {
  name: string
  email: string
  role: Role
}) {
  await requireAdmin()

  const parsed = createEmployeeSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Check email not already taken
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  })
  if (existing) {
    return { error: 'An account with this email already exists' }
  }

  const plainPassword = generatePassword()
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  const user = await prisma.user.create({
    data: {
      name:     parsed.data.name,
      email:    parsed.data.email,
      password: hashedPassword,
      role:     parsed.data.role,
    }
  })

  revalidatePath('/admin')

  // Return plain password ONCE — never stored in plain text again
  return {
    success: true,
    credentials: {
      name:     user.name,
      email:    user.email,
      password: plainPassword,
      role:     user.role,
    }
  }
}

// Update role of existing employee
export async function updateEmployeeRole(userId: string, newRole: Role) {
  await requireAdmin()

  // Prevent admin from demoting themselves
  const session = await auth()
  const currentUserId = (session?.user as any)?.id
  if (userId === currentUserId) {
    return { error: 'You cannot change your own role' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  })

  revalidatePath('/admin')
  return { success: true }
}

// Toggle employee active/inactive (soft disable)
export async function toggleEmployeeStatus(userId: string) {
  await requireAdmin()

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  // Reset failed attempts to unlock, or lock by setting high attempts
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: user.failedAttempts >= 5 ? 0 : 5,
      lockedUntil: user.failedAttempts >= 5 ? null : new Date('2099-01-01'),
    }
  })

  revalidatePath('/admin')
  return { success: true }
}

// Get all employees (excluding current admin)
export async function getEmployees() {
  await requireAdmin()
  const session = await auth()
  const currentUserId = (session?.user as any)?.id

  return prisma.user.findMany({
    where: { id: { not: currentUserId } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      failedAttempts: true,
      lockedUntil: true,
      createdAt: true,
    }
  })
}
