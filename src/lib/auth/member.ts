import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type MemberRole = Database['public']['Enums']['member_role']

export type CurrentMember = {
  memberId: string
  practiceId: string
  userId: string
  role: MemberRole
  activeSurgeryId: string | null
}

export async function getCurrentMember(
  supabase: SupabaseClient<Database>
): Promise<CurrentMember | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

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
