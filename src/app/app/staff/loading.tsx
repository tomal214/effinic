import TablePageLoadingSkeleton from '@/components/app/loading/table-page-skeleton'

export default function StaffLoading() {
  return (
    <TablePageLoadingSkeleton
      label="Loading staff"
      withForm
      withInfoPanel
      columns={5}
    />
  )
}
