'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type StaffMember = {
  id: string
  fullName: string
}

export default function StaffPicker({
  staff,
  selectedId,
  onSelect,
  loading,
}: {
  staff: StaffMember[]
  selectedId?: string
  onSelect: (member: StaffMember) => void
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    )
  }

  if (staff.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No staff available for sign-in.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {staff.map((member) => (
        <Button
          key={member.id}
          type="button"
          variant={selectedId === member.id ? 'default' : 'outline'}
          className={cn(
            'h-14 justify-start px-5 text-base font-medium',
            selectedId === member.id && 'ring-2 ring-ring'
          )}
          onClick={() => onSelect(member)}
        >
          {member.fullName}
        </Button>
      ))}
    </div>
  )
}
