import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadSurgeriesData } from '@/lib/app/page-data'
import SurgeriesView from '@/components/app/SurgeriesView'

export default async function SurgeriesPage() {
  const member = await requireManagerOrViewerPage()
  const admin = createAdminClient()
  const initialData = await loadSurgeriesData(admin, member)

  return (
    <SurgeriesView
      readOnly={member.role === 'viewer'}
      initialData={initialData}
    />
  )
}
