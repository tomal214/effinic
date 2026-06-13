import TablePageLoadingSkeleton from '@/components/app/loading/table-page-skeleton'

export default function IncidentsLoading() {
  return (
    <TablePageLoadingSkeleton label="Loading incidents" columns={5} rows={5} />
  )
}
