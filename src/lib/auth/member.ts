import { cache } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

export type MemberRole = Database['public']['Enums']['member_role']

export type CurrentMember = {
  memberId: string
  practiceId: string
  userId: string
  role: MemberRole
  activeSurgeryId: string | null
}

export type AuthContext = {
  supabase: SupabaseClient<Database>
  user: User | null
  member: CurrentMember | null
}

async function memberFromUser(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<CurrentMember | null> {
  const { data: member } = await supabase
    .from('practice_members')
    .select('id, practice_id, user_id, role, active_surgery_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!member) return null

  return {
    memberId: member.id,
    practiceId: member.practice_id,
    userId: member.user_id,
    role: member.role,
    activeSurgeryId: member.active_surgery_id,
  }
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, member: null }
  }

  const member = await memberFromUser(supabase, user)
  return { supabase, user, member }
})

export async function getCurrentMember(
  supabase?: SupabaseClient<Database>
): Promise<CurrentMember | null> {
  if (!supabase) {
    return (await getAuthContext()).member
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  return memberFromUser(supabase, user)
}

export async function getAuthUser(): Promise<User | null> {
  return (await getAuthContext()).user
}

export async function requireMember(
  supabase: SupabaseClient<Database>
): Promise<CurrentMember> {
  const member = await getCurrentMember(supabase)
  if (!member) {
    throw new MemberAuthError('Unauthorized', 401)
  }
  return member
}

export async function requireRole(
  supabase: SupabaseClient<Database>,
  roles: MemberRole[]
): Promise<CurrentMember> {
  const member = await requireMember(supabase)
  if (!roles.includes(member.role)) {
    throw new MemberAuthError('Forbidden', 403)
  }
  return member
}

export async function requireWriteMember(
  supabase: SupabaseClient<Database>
): Promise<CurrentMember> {
  const member = await requireMember(supabase)
  if (member.role === 'viewer') {
    throw new MemberAuthError('Forbidden', 403)
  }
  return member
}

export async function requireManagerOrAdmin(
  supabase: SupabaseClient<Database>
): Promise<CurrentMember> {
  return requireRole(supabase, ['manager', 'admin'])
}

export async function requireManagerViewerOrAdmin(
  supabase: SupabaseClient<Database>
): Promise<CurrentMember> {
  return requireRole(supabase, ['manager', 'admin', 'viewer'])
}

export async function requireDashboardMember(
  supabase: SupabaseClient<Database>
): Promise<CurrentMember> {
  return requireRole(supabase, [
    'manager',
    'admin',
    'viewer',
    'dentist',
    'hygienist',
  ])
}

export class MemberAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
