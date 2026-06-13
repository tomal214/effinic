import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export type OnboardingStatus = {
  passwordSet: boolean
  hasPracticeMember: boolean
  hasPendingInvite: boolean
  needsPassword: boolean
  ready: boolean
}

export function isPasswordSet(user: User) {
  return user.user_metadata?.password_set === true
}

export async function getOnboardingStatus(user: User): Promise<OnboardingStatus> {
  const admin = createAdminClient()
  const email = user.email?.toLowerCase()
  const passwordSet = isPasswordSet(user)

  const { data: member } = await admin
    .from('practice_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  let hasPendingInvite = false

  if (email) {
    const { data: invite } = await admin
      .from('practice_invites')
      .select('id, expires_at')
      .ilike('email', email)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    hasPendingInvite = Boolean(
      invite && (!invite.expires_at || new Date(invite.expires_at) >= new Date())
    )
  }

  const hasPracticeMember = Boolean(member)
  const needsPassword =
    !passwordSet &&
    (hasPendingInvite || !hasPracticeMember || Boolean(user.invited_at))
  const ready = hasPracticeMember && passwordSet

  return {
    passwordSet,
    hasPracticeMember,
    hasPendingInvite,
    needsPassword,
    ready,
  }
}
