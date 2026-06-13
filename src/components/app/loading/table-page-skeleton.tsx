import {
  AppPageLoadingShell,
  PageHeaderSkeleton,
  TableSkeleton,
} from '@/components/app/loading/page-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function TablePageLoadingSkeleton({
  label = 'Loading',
  withForm = false,
  withInfoPanel = false,
  withHeaderActions = false,
  withFilterPanel = false,
  columns = 4,
  rows = 6,
}: {
  label?: string
  withForm?: boolean
  withInfoPanel?: boolean
  withHeaderActions?: boolean
  withFilterPanel?: boolean
  columns?: number
  rows?: number
}) {
  return (
    <AppPageLoadingShell label={label}>
      <PageHeaderSkeleton withActions={withHeaderActions} />
      {withInfoPanel && (
        <Skeleton className="h-20 w-full rounded-lg md:h-16" />
      )}
      {withFilterPanel && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Skeleton className="h-10 w-full rounded-md sm:w-40" />
          <Skeleton className="h-10 w-full rounded-md sm:w-40" />
          <Skeleton className="h-10 w-full rounded-full sm:w-32" />
        </div>
      )}
      {withForm && (
        <div className="grid gap-4 rounded-lg border border-border p-5 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full md:col-span-2" />
        </div>
      )}
      <TableSkeleton rows={rows} columns={columns} />
    </AppPageLoadingShell>
  )
}
