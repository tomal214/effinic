'use client'

import { Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { EnrichedTask } from '@/lib/services/tasks'

const statusStyles: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  due_soon: 'bg-warning/15 text-foreground',
  overdue: 'bg-danger/10 text-danger',
  completed: 'bg-success/10 text-success',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  completed: 'Done',
}

function formatDueTime(timeDue: string | null) {
  if (!timeDue) return 'Any time'
  return timeDue.slice(0, 5)
}

export default function TaskRow({
  task,
  onSelect,
}: {
  task: EnrichedTask
  onSelect: (task: EnrichedTask) => void
}) {
  const locked = task.status === 'completed' && task.isLocked
  const statusKey = task.computedStatus

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      disabled={locked}
      className={cn(
        'flex w-full items-start gap-3 border-b border-border px-1 py-4 text-left transition-colors',
        locked
          ? 'cursor-not-allowed opacity-60'
          : 'hover:bg-muted/50 active:bg-muted'
      )}
    >
      <div className="mt-1 flex shrink-0 flex-col items-center gap-1">
        <Badge
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusStyles[statusKey] ?? statusStyles.pending
          )}
        >
          {statusLabels[statusKey] ?? statusKey}
        </Badge>
        {task.isMandatory && (
          <Star
            className="size-3.5 fill-warning text-warning"
            aria-label="Mandatory"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-medium leading-snug text-foreground">
            {task.title}
          </p>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {formatDueTime(task.timeDue)}
          </span>
        </div>
        {task.surgeryName && (
          <p className="mt-1 text-sm text-muted-foreground">
            {task.surgeryName}
          </p>
        )}
      </div>

      {locked && (
        <Lock className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
    </button>
  )
}
