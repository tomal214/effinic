import { createAdminClient } from '@/lib/supabase/admin'
import { getPracticeBySlugToken } from '@/lib/auth/practice'
import { jsonError, jsonOk } from '@/lib/api/response'
import { staffListSchema } from '@/lib/validation/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = staffListSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('Invalid request', 400)
    }

    const practice = await getPracticeBySlugToken(
      parsed.data.slug,
      parsed.data.token
    )
    if (!practice) {
      return jsonError('Not found', 404)
    }

    const admin = createAdminClient()
    const { data: members } = await admin
      .from('practice_members')
      .select('id, user_id, practice_member_pins!inner(member_id)')
      .eq('practice_id', practice.id)
      .eq('is_active', true)

    const userIds = members?.map((m) => m.user_id) ?? []
    const { data: profiles } = userIds.length
      ? await admin.from('profiles').select('id, full_name').in('id', userIds)
      : { data: [] }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.full_name])
    )

    const staff =
      members?.map((member) => ({
        id: member.id,
        fullName: profileMap.get(member.user_id) ?? 'Staff member',
      })) ?? []

    return jsonOk(staff)
  } catch (error) {
    console.error('Staff list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
