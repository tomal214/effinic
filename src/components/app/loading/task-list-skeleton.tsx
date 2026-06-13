import {
  AppPageLoadingShell,
  PageHeaderSkeleton,
  RowListSkeleton,
} from '@/components/app/loading/page-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function TaskListLoadingSkeleton() {
  return (
    <AppPageLoadingShell label="Loading tasks">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeaderSkeleton />
        <Skeleton className="h-10 w-full rounded-full sm:w-44" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="overflow-hidden rounded-lg border border-border">
        <RowListSkeleton rows={6} rowClassName="h-[4.5rem] rounded-none border-b border-border last:border-b-0" />
      </div>
      <div
        className="sticky bottom-[var(--app-mobile-nav-offset)] z-30 mt-6 flex flex-col gap-2 border-t border-border bg-canvas pt-4 pb-4 md:static md:bottom-0 md:mt-8 md:border-t-0 md:pt-0 md:pb-0"
        aria-hidden="true"
      >
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </AppPageLoadingShell>
  )
}
