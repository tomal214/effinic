import TablePageLoadingSkeleton from '@/components/app/loading/table-page-skeleton'

export default function TaskHistoryLoading() {
  return (
    <TablePageLoadingSkeleton
      label="Loading task history"
      withFilterPanel
      columns={5}
      rows={8}
    />
  )
}
