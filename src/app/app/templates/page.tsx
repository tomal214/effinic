import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'
import TemplatesView from '@/components/app/TemplatesView'

export default async function TemplatesPage() {
  const member = await requireManagerOrViewerPage()
  return <TemplatesView readOnly={member.role === 'viewer'} />
}
