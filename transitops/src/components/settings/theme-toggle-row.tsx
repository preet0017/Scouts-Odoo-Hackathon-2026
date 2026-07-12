'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggleRow() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {theme === 'dark'
          ? <Moon className="h-5 w-5 text-muted-foreground" />
          : <Sun className="h-5 w-5 text-muted-foreground" />
        }
        <div>
          <p className="text-sm font-medium text-foreground">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </p>
          <p className="text-xs text-muted-foreground">
            Toggle between dark and light theme
          </p>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors focus:outline-none
                    ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full
                          bg-white shadow transition-transform
                          ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  )
}
