'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Truck, Users, MapPin,
  Wrench, Fuel, BarChart3, Settings, LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/fleet', label: 'Fleet', icon: Truck, key: 'fleet' },
  { href: '/drivers', label: 'Drivers', icon: Users, key: 'drivers' },
  { href: '/trips', label: 'Trips', icon: MapPin, key: 'trips' },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, key: 'maintenance' },
  { href: '/fuel', label: 'Fuel & Expenses', icon: Fuel, key: 'fuel' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, key: 'analytics' },
  { href: '/settings', label: 'Settings', icon: Settings, key: 'settings' },
]

const roleNav: Record<string, string[]> = {
  FLEET_MANAGER: ['dashboard', 'fleet', 'maintenance', 'analytics', 'settings'],
  DISPATCHER: ['dashboard', 'fleet', 'trips'],
  SAFETY_OFFICER: ['dashboard', 'drivers', 'trips'],
  FINANCIAL_ANALYST: ['dashboard', 'fleet', 'fuel', 'analytics'],
}

const roleBadgeColor: Record<string, string> = {
  FLEET_MANAGER: 'bg-blue-500/20 text-blue-400',
  DISPATCHER: 'bg-orange-500/20 text-orange-400',
  SAFETY_OFFICER: 'bg-green-500/20 text-green-400',
  FINANCIAL_ANALYST: 'bg-purple-500/20 text-purple-400',
}

const roleLabel: Record<string, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string ?? ''
  const allowedKeys = roleNav[role] ?? ['dashboard']
  const visibleNav = allNavItems.filter(item => allowedKeys.includes(item.key))

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="bg-primary/10 p-1.5 rounded-md">
          <Truck className="h-5 w-5 text-primary" />
        </div>
        <span className="font-bold text-lg text-foreground">TransitOps</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + role badge */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {session?.user?.name?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {session?.user?.name}
            </p>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              roleBadgeColor[role]
            )}>
              {roleLabel[role] ?? role}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
