import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth/member'
import { safeNext } from '@/lib/auth/safe-next'
import LoginForm from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const [{ user }, params] = await Promise.all([getAuthContext(), searchParams])

  if (user) {
    redirect(safeNext(params.next))
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
