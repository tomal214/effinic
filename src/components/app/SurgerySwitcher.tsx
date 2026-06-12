'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Surgery = {
  id: string
  name: string
}

export default function SurgerySwitcher({
  surgeries,
  activeSurgeryId,
  onSwitch,
}: {
  surgeries: Surgery[]
  activeSurgeryId: string | null
  onSwitch?: (surgeryId: string) => void
}) {
  const [optimisticId, setOptimisticId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const value = optimisticId ?? activeSurgeryId ?? ''

  async function handleChange(surgeryId: string) {
    setOptimisticId(surgeryId)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/surgery/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surgeryId }),
      })

      if (res.ok) {
        onSwitch?.(surgeryId)
      }
    } catch (error) {
      console.error('Surgery switch failed:', error)
    } finally {
      setOptimisticId(null)
      setLoading(false)
    }
  }

  if (surgeries.length === 0) return null

  return (
    <Select
      value={value}
      onValueChange={(v) => v && handleChange(v)}
      disabled={loading}
    >
      <SelectTrigger className="h-10 min-w-[140px] rounded-full">
        <SelectValue placeholder="Surgery" />
      </SelectTrigger>
      <SelectContent>
        {surgeries.map((surgery) => (
          <SelectItem key={surgery.id} value={surgery.id}>
            {surgery.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
