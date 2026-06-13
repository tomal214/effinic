import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'
import { loadTemplatesPageData } from '@/lib/app/page-data'
import TemplatesView from '@/components/app/TemplatesView'

export default async function TemplatesPage() {
  const member = await requireManagerOrViewerPage()
  const initialData = await loadTemplatesPageData(member)

  return (
    <TemplatesView
      readOnly={member.role === 'viewer'}
      initialData={initialData}
    />
  )
}
