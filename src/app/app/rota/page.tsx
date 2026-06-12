import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth/member'
import RotaView from '@/components/app/RotaView'

export default async function RotaPage() {
  const supabase = await createClient()
  const member = await getCurrentMember(supabase)

  if (!member) {
    redirect('/login')
  }

  const allowed = ['admin', 'manager', 'viewer'].includes(member.role)
  if (!allowed) {
    redirect('/app')
  }

  return <RotaView />
}
