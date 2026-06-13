import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth/member'
import {
  canCreateIncident,
  canManageIncidents,
} from '@/lib/incidents/access'
import { loadIncidentsPageData } from '@/lib/app/page-data'
import IncidentsView from '@/components/app/IncidentsView'

export default async function IncidentsPage() {
  const { supabase, member } = await getAuthContext()

  if (!member) {
    redirect('/login')
  }

  const initialData = await loadIncidentsPageData(supabase, member)

  return (
    <IncidentsView
      canCreate={canCreateIncident(member.role)}
      canManage={canManageIncidents(member.role)}
      initialData={initialData}
    />
  )
}
