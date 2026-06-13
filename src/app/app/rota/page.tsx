import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth/member'
import {
  defaultRotaWeekStart,
  loadRotaPageData,
} from '@/lib/app/page-data'
import RotaView from '@/components/app/RotaView'

export default async function RotaPage() {
  const { supabase, member } = await getAuthContext()

  if (!member) {
    redirect('/login')
  }

  const allowed = ['admin', 'manager', 'viewer'].includes(member.role)
  if (!allowed) {
    redirect('/app')
  }

  const weekStart = defaultRotaWeekStart()
  const initialData = await loadRotaPageData(supabase, member, weekStart)

  return <RotaView initialData={initialData} />
}
