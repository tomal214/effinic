import {
  AppPageLoadingShell,
  PageHeaderSkeleton,
} from '@/components/app/loading/page-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <AppPageLoadingShell label="Loading page">
      <PageHeaderSkeleton />
      <Skeleton className="h-48 w-full rounded-xl" />
    </AppPageLoadingShell>
  )
}
