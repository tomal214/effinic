import TablePageLoadingSkeleton from '@/components/app/loading/table-page-skeleton'

export default function SurgeriesLoading() {
  return (
    <TablePageLoadingSkeleton
      label="Loading surgeries"
      withForm
      columns={3}
    />
  )
}
