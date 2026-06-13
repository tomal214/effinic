import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth/member'
import DashboardView from '@/components/app/DashboardView'

const DASHBOARD_ROLES = [
  'manager',
  'admin',
  'viewer',
  'dentist',
  'hygienist',
]

export default async function AppHomePage() {
  const supabase = await createClient()
  const member = await getCurrentMember(supabase)

  if (!member) {
    redirect('/login')
  }

  if (member.role === 'nurse' || member.role === 'receptionist') {
    redirect('/app/tasks')
  }

  if (!DASHBOARD_ROLES.includes(member.role)) {
    redirect('/app/tasks')
  }

  return <DashboardView readOnly={member.role === 'viewer'} />
}
