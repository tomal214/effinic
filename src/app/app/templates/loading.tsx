import TablePageLoadingSkeleton from '@/components/app/loading/table-page-skeleton'

export default function TemplatesLoading() {
  return (
    <TablePageLoadingSkeleton
      label="Loading templates"
      withForm
      columns={4}
    />
  )
}
