'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { saveSettings } from '@/app/actions/settings'

const schema = z.object({
  depotName:    z.string().min(1, 'Depot name required'),
  currency:     z.string().min(1),
  distanceUnit: z.string().min(1),
})
type FormData = z.infer<typeof schema>

export function SettingsForm({ settings }: { settings: FormData }) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: settings,
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await saveSettings(data)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Settings saved successfully')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="space-y-2">
          <Label>Depot Name</Label>
          <Input
            placeholder="Gandhinagar Depot G24"
            {...register('depotName')}
          />
          {errors.depotName && (
            <p className="text-xs text-destructive">{errors.depotName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            defaultValue={settings.currency}
            onValueChange={(val) => setValue('currency', val ?? settings.currency)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR (Rs)">INR (Rs)</SelectItem>
              <SelectItem value="USD ($)">USD ($)</SelectItem>
              <SelectItem value="EUR (€)">EUR (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Distance Unit</Label>
          <Select
            defaultValue={settings.distanceUnit}
            onValueChange={(val) => setValue('distanceUnit', val ?? settings.distanceUnit)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Kilometers">Kilometers</SelectItem>
              <SelectItem value="Miles">Miles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
