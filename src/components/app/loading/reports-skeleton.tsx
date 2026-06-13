import {
  AppPageLoadingShell,
  PageHeaderSkeleton,
} from '@/components/app/loading/page-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoadingSkeleton() {
  return (
    <AppPageLoadingShell label="Loading reports">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full max-w-xs rounded-md" />
      <Skeleton className="h-56 w-full rounded-xl sm:h-64 md:h-72" />
      <div className="rounded-xl border border-border p-5">
        <Skeleton className="mb-4 h-5 w-32" />
        <Skeleton className="h-10 w-full max-w-sm rounded-full" />
      </div>
    </AppPageLoadingShell>
  )
}
