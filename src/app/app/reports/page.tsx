import { requireReportsPage } from '@/lib/auth/page-guards'
import { loadReportsPageData } from '@/lib/app/page-data'
import ReportsView from '@/components/app/ReportsView'

export default async function ReportsPage() {
  const member = await requireReportsPage()
  const initialData = await loadReportsPageData(member, 8)

  return (
    <ReportsView
      readOnly={member.role === 'viewer'}
      initialData={initialData}
    />
  )
}
