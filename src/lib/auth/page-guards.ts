import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/lib/auth/member'

export async function requireManagerPage() {
  const member = await getCurrentMember()

  if (!member) {
    redirect('/login')
  }

  if (member.role !== 'manager' && member.role !== 'admin') {
    redirect('/app')
  }

  return member
}

export async function requireManagerOrViewerPage() {
  const member = await getCurrentMember()

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
