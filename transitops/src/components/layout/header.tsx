'use client'

import { useSession } from 'next-auth/react'
import { Search, Bell, Sun, Moon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

const roleLabel: Record<string, string> = {
  ADMIN:            'Admin',
  FLEET_MANAGER:    'Fleet Manager',
  DISPATCHER:       'Dispatcher',
  SAFETY_OFFICER:   'Safety Officer',
  FINANCIAL_ANALYST:'Financial Analyst',
}

const roleBadgeColor: Record<string, string> = {
  ADMIN:            'bg-red-500/20 text-red-400',
  FLEET_MANAGER:    'bg-blue-500/20 text-blue-400',
  DISPATCHER:       'bg-orange-500/20 text-orange-400',
  SAFETY_OFFICER:   'bg-green-500/20 text-green-400',
  FINANCIAL_ANALYST:'bg-purple-500/20 text-purple-400',
}

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const role = (session?.user as any)?.role as string ?? ''

  return (
    <header className="h-16 border-b border-border bg-card
                       flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 w-64 bg-background"
          />
        </div>

        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {session?.user?.name}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${roleBadgeColor[role] ?? 'bg-gray-500/20 text-gray-400'}`}>
            {roleLabel[role] ?? role}
          </span>
        </div>
      </div>
    </header>
  )
}
