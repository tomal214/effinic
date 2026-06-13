import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'
import { loadStaffPageData } from '@/lib/app/page-data'
import StaffView from '@/components/app/StaffView'

export default async function StaffPage() {
  const member = await requireManagerOrViewerPage()
  const initialData = await loadStaffPageData(member)

  return (
    <StaffView
      readOnly={member.role === 'viewer'}
      initialData={initialData}
    />
  )
}
