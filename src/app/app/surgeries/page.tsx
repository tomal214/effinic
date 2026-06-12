import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'
import SurgeriesView from '@/components/app/SurgeriesView'

export default async function SurgeriesPage() {
  const member = await requireManagerOrViewerPage()
  return <SurgeriesView readOnly={member.role === 'viewer'} />
}
