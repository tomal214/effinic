'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KioskDesk } from '@/lib/auth/kiosk-desk'

const DESK_OPTIONS: {
  value: KioskDesk
  label: string
  subtext: string
}[] = [
  {
    value: 'clinical',
    label: 'Clinical staff',
    subtext: 'Nurses and surgery tasks',
  },
  {
    value: 'reception',
    label: 'Reception',
    subtext: 'Front desk tasks',
  },
]

export default function KioskDeskPicker({
  selected,
  onSelect,
}: {
  selected: KioskDesk | null
  onSelect: (desk: KioskDesk) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {DESK_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={selected === option.value ? 'default' : 'outline'}
          className={cn(
            'h-auto min-h-14 flex-col items-start gap-0.5 px-5 py-4 text-left',
            selected === option.value && 'ring-2 ring-ring'
          )}
          onClick={() => onSelect(option.value)}
        >
          <span className="text-base font-medium">{option.label}</span>
          <span
            className={cn(
              'text-sm font-normal',
              selected === option.value
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'
            )}
          >
            {option.subtext}
          </span>
        </Button>
      ))}
    </div>
  )
}
