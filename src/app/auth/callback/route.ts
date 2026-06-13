import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { linkManagerToPractice } from '@/lib/auth/link-manager-to-practice'
import { getOnboardingStatus } from '@/lib/auth/onboarding-status'
import { safeNext } from '@/lib/auth/safe-next'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback failed:', error)
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const status = await getOnboardingStatus(user)

      if (status.needsPassword) {
        const confirmUrl = new URL(`${origin}/auth/confirm`)
        confirmUrl.searchParams.set('invite', '1')
        confirmUrl.searchParams.set('next', next)
        return NextResponse.redirect(confirmUrl.toString())
      }

      if (status.hasPendingInvite && !status.hasPracticeMember) {
        await linkManagerToPractice(user)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
