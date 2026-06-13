import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth/member'
import { isPasswordSet } from '@/lib/auth/onboarding-status'
import AppNav from '@/components/app/AppNav'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const member = await getCurrentMember(supabase)

  if (!member) {
    redirect('/login')
  }

  if (
    user &&
    (member.role === 'manager' || member.role === 'admin') &&
    !isPasswordSet(user)
  ) {
    redirect(`/auth/confirm?next=${encodeURIComponent('/app')}`)
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas md:flex-row">
      <AppNav role={member.role} readOnly={member.role === 'viewer'} />
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="app-main flex w-full flex-1 flex-col md:mx-auto md:max-w-5xl">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  )
}
