import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { generatePin, hashPin } from '@/lib/auth/pin'
import type { createStaffSchema, updateStaffSchema } from '@/lib/validation/staff'
import type { z } from 'zod'

type AdminClient = SupabaseClient<Database>

export async function listStaff(admin: AdminClient, practiceId: string) {
  const { data: members, error } = await admin
    .from('practice_members')
    .select('id, role, is_active, user_id, created_at')
    .eq('practice_id', practiceId)
    .order('created_at')

  if (error) throw error

  const userIds = (members ?? []).map((m) => m.user_id)
  const profileMap = new Map<string, string>()
  const emailMap = new Map<string, string>()

  if (userIds.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    for (const profile of profiles ?? []) {
      profileMap.set(profile.id, profile.full_name)
    }

    for (const userId of userIds) {
      const { data: userData } = await admin.auth.admin.getUserById(userId)
      if (userData.user?.email) {
        emailMap.set(userId, userData.user.email)
      }
    }
  }

  return (members ?? []).map((member) => ({
    id: member.id,
    userId: member.user_id,
    fullName: profileMap.get(member.user_id) ?? 'Unknown',
    email: emailMap.get(member.user_id) ?? null,
    role: member.role,
    isActive: member.is_active,
    createdAt: member.created_at,
  }))
}

export async function createStaff(
  admin: AdminClient,
  practiceId: string,
  practiceSlug: string,
  input: z.infer<typeof createStaffSchema>
) {
  const email =
    input.email && input.email.length > 0
      ? input.email
      : `${practiceSlug}.${randomBytes(4).toString('hex')}@practice.internal`

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  })

  if (authError || !authUser.user) {
    throw new Error(authError?.message ?? 'Failed to create user')
  }

  const pin = generatePin()
  const pinHash = await hashPin(pin)

  const { error: profileError } = await admin.from('profiles').insert({
    id: authUser.user.id,
    full_name: input.fullName,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    throw profileError
  }

  const { data: member, error: memberError } = await admin
    .from('practice_members')
    .insert({
      practice_id: practiceId,
      user_id: authUser.user.id,
      role: input.role,
    })
    .select('id, role, is_active, user_id, created_at')
    .single()

  if (memberError) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    throw memberError
  }

  const { error: pinError } = await admin.from('practice_member_pins').insert({
    member_id: member.id,
    pin_hash: pinHash,
  })

  if (pinError) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    throw pinError
  }

  return {
    member: {
      id: member.id,
      userId: member.user_id,
      fullName: input.fullName,
      email,
      role: member.role,
      isActive: member.is_active,
      createdAt: member.created_at,
    },
    pin,
  }
}

export async function updateStaff(
  admin: AdminClient,
  practiceId: string,
  memberId: string,
  input: z.infer<typeof updateStaffSchema>
) {
  const { data: existing } = await admin
    .from('practice_members')
    .select('id, user_id')
    .eq('id', memberId)
    .eq('practice_id', practiceId)
    .maybeSingle()

  if (!existing) return null

  if (input.fullName) {
    await admin
      .from('profiles')
      .update({ full_name: input.fullName })
      .eq('id', existing.user_id)
  }

  const memberUpdates: {
    role?: typeof input.role
    is_active?: boolean
  } = {}

  if (input.role !== undefined) memberUpdates.role = input.role
  if (input.isActive !== undefined) memberUpdates.is_active = input.isActive

  if (Object.keys(memberUpdates).length) {
    const { error } = await admin
      .from('practice_members')
      .update(memberUpdates)
      .eq('id', memberId)

    if (error) throw error
  }

  return getStaffMember(admin, practiceId, memberId)
}

export async function softDeleteStaff(
  admin: AdminClient,
  practiceId: string,
  memberId: string
) {
  const { data, error } = await admin
    .from('practice_members')
    .update({ is_active: false })
    .eq('id', memberId)
    .eq('practice_id', practiceId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function resetStaffPin(
  admin: AdminClient,
  practiceId: string,
  memberId: string
) {
  const pin = generatePin()
  const pinHash = await hashPin(pin)

  const { data: member } = await admin
    .from('practice_members')
    .select('id')
    .eq('id', memberId)
    .eq('practice_id', practiceId)
    .maybeSingle()

  if (!member) return null

  const { data, error } = await admin
    .from('practice_member_pins')
    .upsert({
      member_id: memberId,
      pin_hash: pinHash,
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .select('member_id')
    .single()

  if (error) throw error
  if (!data) return null

  return { pin }
}

async function getStaffMember(
  admin: AdminClient,
  practiceId: string,
  memberId: string
) {
  const staff = await listStaff(admin, practiceId)
  return staff.find((s) => s.id === memberId) ?? null
}
