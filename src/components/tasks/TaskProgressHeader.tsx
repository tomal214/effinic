import { cn } from '@/lib/utils'

export default function TaskProgressHeader({
  completedCount,
  totalCount,
  dateLabel,
  className,
}: {
  completedCount: number
  totalCount: number
  dateLabel: string
  className?: string
}) {
  const safeCompleted = Math.max(0, Math.min(completedCount, totalCount))

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {completedCount} of {totalCount} complete
          </p>
          {dateLabel ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {dateLabel}
            </p>
          ) : null}
        </div>
        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {totalCount ? Math.round((safeCompleted / totalCount) * 100) : 0}%
        </p>
      </div>

      <progress
        value={safeCompleted}
        max={Math.max(1, totalCount)}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent"
        aria-label="Task completion progress"
      />
    </div>
  )
}

