import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'
import StaffView from '@/components/app/StaffView'

export default async function StaffPage() {
  const member = await requireManagerOrViewerPage()
  return <StaffView readOnly={member.role === 'viewer'} />
}
