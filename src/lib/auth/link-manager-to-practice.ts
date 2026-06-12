import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

type LinkFailure = {
  linked: false
  reason: 'no_practice' | 'no_invite' | 'db_error'
}

type LinkSuccess = {
  linked: true
  practiceId: string
  alreadyMember: boolean
}

export type LinkManagerResult = LinkFailure | LinkSuccess

export async function linkManagerToPractice(user: User): Promise<LinkManagerResult> {
  const practiceId = user.user_metadata?.practice_id as string | undefined
  if (!practiceId || !user.email) {
    return { linked: false, reason: 'no_practice' }
  }

  const admin = createAdminClient()
  const email = user.email.toLowerCase()

  const { data: existing, error: existingError } = await admin
    .from('practice_members')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    console.error('Check membership failed:', existingError)
    return { linked: false, reason: 'db_error' }
  }

  if (existing) {
    return { linked: true, practiceId, alreadyMember: true }
  }

  const { data: invite, error: inviteError } = await admin
    .from('practice_invites')
    .select('id, expires_at')
    .eq('practice_id', practiceId)
    .ilike('email', email)
    .is('used_at', null)
    .maybeSingle()

  if (inviteError) {
    console.error('Check invite failed:', inviteError)
    return { linked: false, reason: 'db_error' }
  }

  if (!invite) {
    return { linked: false, reason: 'no_invite' }
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { linked: false, reason: 'no_invite' }
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email.split('@')[0] ??
    'Manager'

  const { error: profileError } = await admin.from('profiles').upsert({
    id: user.id,
    full_name: fullName,
  })

  if (profileError) {
    console.error('Profile upsert failed:', profileError)
    return { linked: false, reason: 'db_error' }
  }

  const { error: memberError } = await admin.from('practice_members').insert({
    practice_id: practiceId,
    user_id: user.id,
    role: 'manager',
  })

  if (memberError) {
    console.error('Practice member insert failed:', memberError)
    return { linked: false, reason: 'db_error' }
  }

  const { error: usedError } = await admin
    .from('practice_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id)

  if (usedError) {
    console.error('Mark invite used failed:', usedError)
  }

  return { linked: true, practiceId, alreadyMember: false }
}
