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

  if (user && !isPasswordSet(user)) {
    redirect(`/auth/confirm?next=${encodeURIComponent('/app')}`)
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <AppNav role={member.role} readOnly={member.role === 'viewer'} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
