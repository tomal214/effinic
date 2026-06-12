import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth/member'
import NurseTasksView from '@/components/app/NurseTasksView'
import ManagerTasksView from '@/components/app/ManagerTasksView'

const NURSE_ROLES = new Set(['nurse', 'receptionist'])
const MANAGER_TASK_ROLES = new Set(['manager', 'admin', 'viewer'])

export default async function TasksPage() {
  const supabase = await createClient()
  const member = await getCurrentMember(supabase)
  if (!member) redirect('/login')

  if (NURSE_ROLES.has(member.role)) {
    return <NurseTasksView />
  }

  if (MANAGER_TASK_ROLES.has(member.role)) {
    return <ManagerTasksView readOnly={member.role === 'viewer'} />
  }

  redirect('/app')
}
