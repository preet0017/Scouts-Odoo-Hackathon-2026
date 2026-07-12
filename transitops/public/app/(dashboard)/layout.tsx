import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Toaster } from 'sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </SessionProvider>
  )
}
