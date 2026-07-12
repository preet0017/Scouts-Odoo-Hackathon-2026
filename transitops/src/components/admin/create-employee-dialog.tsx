'use client'

import { useState, useTransition } from 'react'
import { Role } from '@prisma/client'
import { createEmployee } from '@/app/actions/admin'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Plus, Copy, CheckCircle, AlertTriangle } from 'lucide-react'

const schema = z.object({
  name:  z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role:  z.nativeEnum(Role),
})
type FormData = z.infer<typeof schema>

type Credentials = {
  name: string
  email: string
  password: string
  role: Role
}

const roleLabels: Record<Role, string> = {
  ADMIN:            'Admin',
  FLEET_MANAGER:    'Fleet Manager',
  DISPATCHER:       'Dispatcher',
  SAFETY_OFFICER:   'Safety Officer',
  FINANCIAL_ANALYST:'Financial Analyst',
}

export function CreateEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: Role.DISPATCHER }
  })

  function onSubmit(data: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createEmployee(data)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.credentials) {
        setCredentials(result.credentials)
      }
    })
  }

  function handleCopy() {
    if (!credentials) return
    const text = `TransitOps Login Credentials\n\nName: ${credentials.name}\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nRole: ${roleLabels[credentials.role]}\n\nLogin at: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credentials copied to clipboard')
    setTimeout(() => setCopied(false), 3000)
  }

  function handleDone() {
    setOpen(false)
    setCredentials(null)
    setError(null)
    setCopied(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) handleDone()
      else setOpen(true)
    }}>
      <DialogTrigger render={<Button className="flex items-center gap-2" />}>
        <Plus className="h-4 w-4" />
        Add Employee
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {credentials ? '✅ Account Created' : 'Create Employee Account'}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — Creation Form */}
        {!credentials && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Raven K."
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
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
              <Label>Role</Label>
              <Select
                defaultValue={Role.DISPATCHER}
                onValueChange={(val) => setValue('role', val as Role)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels)
                    .filter(([value]) => value !== 'ADMIN')
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleDone}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2 — Credentials Reveal (shown ONCE) */}
        {credentials && (
          <div className="space-y-4 mt-2">
            <Alert className="border-orange-500/30 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300 text-sm">
                Copy these credentials now — the password will never be shown again.
              </AlertDescription>
            </Alert>

            <div className="bg-muted rounded-lg p-4 space-y-3 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{credentials.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground font-medium">{credentials.email}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="text-muted-foreground">Password</span>
                <span className="text-green-400 font-bold text-base tracking-wider">
                  {credentials.password}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Role</span>
                <span className="text-foreground font-medium">
                  {roleLabels[credentials.role]}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
              <p className="font-medium mb-1">What this employee can access:</p>
              {credentials.role === 'FLEET_MANAGER'    && <p>Fleet management, Maintenance, Analytics, Settings</p>}
              {credentials.role === 'DISPATCHER'       && <p>Dashboard, Fleet (view), Trip dispatch</p>}
              {credentials.role === 'SAFETY_OFFICER'   && <p>Driver profiles, Safety scores, Trip view</p>}
              {credentials.role === 'FINANCIAL_ANALYST'&& <p>Fuel logs, Expenses, Analytics</p>}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopy}
              >
                {copied
                  ? <><CheckCircle className="h-4 w-4 mr-2 text-green-400" /> Copied!</>
                  : <><Copy className="h-4 w-4 mr-2" /> Copy Credentials</>
                }
              </Button>
              <Button className="flex-1" onClick={handleDone}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
