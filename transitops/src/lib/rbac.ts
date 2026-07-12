import { Role } from '@prisma/client'

type Resource = 'fleet' | 'drivers' | 'trips' | 'maintenance' | 'fuel' | 'analytics' | 'settings' | 'admin'
type Action   = 'view' | 'edit'

const permissions: Record<Role, Partial<Record<Resource, Action>>> = {
  ADMIN:            {
    fleet: 'edit', drivers: 'edit', trips: 'edit',
    maintenance: 'edit', fuel: 'edit', analytics: 'view',
    settings: 'edit', admin: 'edit'
  },
  FLEET_MANAGER:    { fleet: 'edit', drivers: 'edit' },
  DISPATCHER:       { trips: 'edit', maintenance: 'edit' },
  SAFETY_OFFICER:   { fuel: 'edit', analytics: 'view' },
  FINANCIAL_ANALYST:{ fleet: 'view', fuel: 'edit', analytics: 'view' },
}

export function can(role: Role, resource: Resource, action: Action = 'view'): boolean {
  const allowed = permissions[role]?.[resource]
  if (!allowed) return false
  if (action === 'view') return allowed === 'view' || allowed === 'edit'
  return allowed === 'edit'
}

// Nav items visible per role — matches sidebar
export const navByRole: Record<Role, string[]> = {
  ADMIN:            ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel', 'analytics', 'settings', 'admin'],
  FLEET_MANAGER:    ['dashboard', 'fleet', 'drivers'],
  DISPATCHER:       ['dashboard', 'trips', 'maintenance'],
  SAFETY_OFFICER:   ['dashboard', 'fuel', 'analytics'],
  FINANCIAL_ANALYST:['dashboard', 'fleet', 'fuel', 'analytics'],
}
