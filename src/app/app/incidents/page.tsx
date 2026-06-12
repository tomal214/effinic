import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth/member'
import {
  canCreateIncident,
  canManageIncidents,
} from '@/lib/incidents/access'
import IncidentsView from '@/components/app/IncidentsView'

export default async function IncidentsPage() {
  const supabase = await createClient()
  const member = await getCurrentMember(supabase)

  if (!member) {
    redirect('/login')
  }

  return (
    <IncidentsView
      canCreate={canCreateIncident(member.role)}
      canManage={canManageIncidents(member.role)}
    />
  )
}
