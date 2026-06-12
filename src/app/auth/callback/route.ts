import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

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
      const practiceId = user.user_metadata?.practice_id as string | undefined
      if (practiceId) {
        const admin = createAdminClient()
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split('@')[0] ??
          'Manager'

        await admin.from('profiles').upsert({
          id: user.id,
          full_name: fullName,
        })

        const { data: existing } = await admin
          .from('practice_members')
          .select('id')
          .eq('practice_id', practiceId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existing) {
          await admin.from('practice_members').insert({
            practice_id: practiceId,
            user_id: user.id,
            role: 'manager',
          })
        }

        if (user.email) {
          await admin
            .from('practice_invites')
            .update({ used_at: new Date().toISOString() })
            .eq('practice_id', practiceId)
            .eq('email', user.email)
            .is('used_at', null)
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
