import { Role } from '@prisma/client'

type Resource = 'fleet' | 'drivers' | 'trips' | 'maintenance' | 'fuel' | 'analytics' | 'settings'
type Action   = 'view' | 'edit'

const permissions: Record<Role, Partial<Record<Resource, Action>>> = {
  FLEET_MANAGER:     { fleet: 'edit', maintenance: 'edit', analytics: 'view', settings: 'edit' },
  DISPATCHER:        { fleet: 'view', trips: 'edit' },
  SAFETY_OFFICER:    { drivers: 'edit', trips: 'view' },
  FINANCIAL_ANALYST: { fleet: 'view', fuel: 'edit', analytics: 'view' },
}

export function can(role: Role, resource: Resource, action: Action = 'view'): boolean {
  const allowed = permissions[role]?.[resource]
  if (!allowed) return false
  if (action === 'view') return allowed === 'view' || allowed === 'edit'
  return allowed === 'edit'
}

export const navByRole: Record<Role, string[]> = {
  FLEET_MANAGER:     ['dashboard', 'fleet', 'maintenance', 'analytics', 'settings'],
  DISPATCHER:        ['dashboard', 'fleet', 'trips'],
  SAFETY_OFFICER:    ['dashboard', 'drivers', 'trips'],
  FINANCIAL_ANALYST: ['dashboard', 'fleet', 'fuel', 'analytics'],
}
