'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error === 'ACCOUNT_LOCKED') {
      setError('Account locked after 5 failed attempts. Try again in 15 minutes.')
      return
    }

    if (result?.error) {
      setError('Invalid credentials. Please check your email and password.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-card flex-col justify-between p-12 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">TransitOps</h1>
            <p className="text-sm text-muted-foreground">Smart Transport Operations Platform</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            One login,<br />four roles.
          </h2>
          <div className="space-y-3">
            {[
              { role: 'Fleet Manager',     desc: 'Fleet, Maintenance, Lifecycle' },
              { role: 'Dispatcher',        desc: 'Dashboard, Trips, Dispatch' },
              { role: 'Safety Officer',    desc: 'Drivers, Compliance, Scores' },
              { role: 'Financial Analyst', desc: 'Fuel, Expenses, Analytics' },
            ].map(({ role, desc }) => (
              <div key={role} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div>
                  <span className="text-foreground font-medium">{role}</span>
                  <span className="text-muted-foreground text-sm ml-2">— {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          TRANSITOPS © 2026 — RBAC ENABLED
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="raven@transitops.in"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                <p className="font-medium">Access &amp; roles:</p>
                <p>• Fleet Manager — Fleet, Maintenance</p>
                <p>• Dispatcher — Dashboard, Trips</p>
                <p>• Safety Officer — Drivers, Compliance</p>
                <p>• Financial Analyst — Fuel &amp; Expenses, Analytics</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
