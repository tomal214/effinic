import {
  AppPageLoadingShell,
  PageHeaderSkeleton,
} from '@/components/app/loading/page-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function RotaLoadingSkeleton() {
  return (
    <AppPageLoadingShell label="Loading rota">
      <PageHeaderSkeleton withActions actionCount={2} />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <Skeleton className="h-12 w-full rounded-none" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-14 w-full min-w-[640px] rounded-none border-t border-border"
          />
        ))}
      </div>
    </AppPageLoadingShell>
  )
}
