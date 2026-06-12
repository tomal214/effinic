import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth/member'

export async function requireManagerPage() {
  const supabase = await createClient()
  const member = await getCurrentMember(supabase)

  if (!member) {
    redirect('/login')
  }

  if (member.role !== 'manager' && member.role !== 'admin') {
    redirect('/app')
  }

  return member
}

export async function requireManagerOrViewerPage() {
  const supabase = await createClient()
  const member = await getCurrentMember(supabase)

  if (!member) {
    redirect('/login')
  }

  if (!['manager', 'admin', 'viewer'].includes(member.role)) {
    redirect('/app')
  }

  return member
}

export async function requireReportsPage() {
  return requireManagerOrViewerPage()
}
