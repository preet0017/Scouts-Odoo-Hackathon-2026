import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/settings/settings-form'
import { ThemeToggleRow } from '@/components/settings/theme-toggle-row'
import { getSettings } from '@/app/actions/settings'
import { Shield, Settings2, Palette } from 'lucide-react'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        <PageHeader
          title="Settings"
          description="Manage your depot configuration and preferences"
        />

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settings} />
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeToggleRow />
          </CardContent>
        </Card>

        {/* RBAC Reference Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role-Based Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-6 text-muted-foreground font-medium">
                      Role
                    </th>
                    {['Fleet', 'Drivers', 'Trips', 'Fuel/Exp', 'Analytics'].map(h => (
                      <th key={h} className="text-center py-2 px-4 text-muted-foreground font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { role: 'Fleet Manager',     color: 'text-blue-400',   vals: ['✓',    '✓',   '—',    '—',  'View'] },
                    { role: 'Dispatcher',        color: 'text-orange-400', vals: ['View', '—',   '✓',    '—',  '—']   },
                    { role: 'Safety Officer',    color: 'text-green-400',  vals: ['—',    '✓',   'View', '—',  '—']   },
                    { role: 'Financial Analyst', color: 'text-purple-400', vals: ['View', '—',   '—',    '✓',  'View'] },
                  ].map(({ role, color, vals }) => (
                    <tr key={role}>
                      <td className={`py-3 pr-6 font-medium ${color}`}>
                        {role}
                      </td>
                      {vals.map((v, i) => (
                        <td key={i} className={`text-center py-3 px-4
                          ${v === '—'
                            ? 'text-muted-foreground'
                            : 'text-green-400 font-medium'
                          }`}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
