import { Skeleton } from '@/components/ui/skeleton'

export function AppPageLoadingShell({
  children,
  label = 'Loading page',
}: {
  children: React.ReactNode
  label?: string
}) {
  return (
    <div
      className="flex flex-1 flex-col gap-8 px-5 py-6 md:px-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div aria-hidden="true" className="flex flex-1 flex-col gap-8">
        {children}
      </div>
    </div>
  )
}

export function PageHeaderSkeleton({
  withActions = false,
  actionCount = 1,
}: {
  withActions?: boolean
  actionCount?: number
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-7 w-40 md:h-8 md:w-52" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
      {withActions && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {Array.from({ length: actionCount }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-10 w-24 rounded-full sm:w-28"
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function RowListSkeleton({
  rows = 5,
  rowClassName = 'h-16 rounded-xl',
}: {
  rows?: number
  rowClassName?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={rowClassName} />
      ))}
    </div>
  )
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="hidden gap-4 border-b border-border bg-muted/30 px-4 py-3 md:grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-col gap-3 px-4 py-4 md:grid md:items-center md:gap-4 md:py-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={`h-4 ${colIndex === 0 ? 'w-3/4' : 'w-1/2'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
