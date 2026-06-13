import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadSurgeriesData, loadTasksData } from '@/lib/app/page-data'
import NurseTasksView from '@/components/app/NurseTasksView'
import ManagerTasksView from '@/components/app/ManagerTasksView'

const NURSE_ROLES = new Set(['nurse', 'receptionist'])
const MANAGER_TASK_ROLES = new Set(['manager', 'admin', 'viewer'])

export default async function TasksPage() {
  const member = await getCurrentMember()
  if (!member) redirect('/login')

  const admin = createAdminClient()
  const [tasksData, surgeriesData] = await Promise.all([
    loadTasksData(admin, member),
    loadSurgeriesData(admin, member),
  ])

  const initialData = { tasks: tasksData, surgeries: surgeriesData }

  if (NURSE_ROLES.has(member.role)) {
    return <NurseTasksView initialData={initialData} />
  }

  if (MANAGER_TASK_ROLES.has(member.role)) {
    return (
      <ManagerTasksView
        readOnly={member.role === 'viewer'}
        initialData={initialData}
      />
    )
  }

  redirect('/app')
}
