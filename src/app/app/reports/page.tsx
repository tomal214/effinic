import { requireReportsPage } from '@/lib/auth/page-guards'
import ReportsView from '@/components/app/ReportsView'

export default async function ReportsPage() {
  const member = await requireReportsPage()
  return <ReportsView readOnly={member.role === 'viewer'} />
}
