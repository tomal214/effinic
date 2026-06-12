import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/lib/auth/member'
import AppNav from '@/components/app/AppNav'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const member = await getCurrentMember(supabase)

  if (!member) {
    redirect('/login')
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
