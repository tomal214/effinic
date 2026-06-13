import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/lib/auth/member'
import { loadDashboardPageData } from '@/lib/app/page-data'
import DashboardView from '@/components/app/DashboardView'

const DASHBOARD_ROLES = [
  'manager',
  'admin',
  'viewer',
  'dentist',
  'hygienist',
]

export default async function AppHomePage() {
  const member = await getCurrentMember()

  if (!member) {
    redirect('/login')
  }

  if (member.role === 'nurse' || member.role === 'receptionist') {
    redirect('/app/tasks')
  }

  if (!DASHBOARD_ROLES.includes(member.role)) {
    redirect('/app/tasks')
  }

  const initialData = await loadDashboardPageData(member)

  return (
    <DashboardView
      readOnly={member.role === 'viewer'}
      initialData={initialData}
    />
  )
}
