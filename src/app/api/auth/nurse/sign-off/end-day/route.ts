import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { canSignOffEndDay } from '@/lib/session/mandatory-gate'
import { fetchMemberGateTasks } from '@/lib/tasks/sign-off-tasks'
import { jsonError, jsonOk } from '@/lib/api/response'

export async function POST() {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)
    const admin = createAdminClient()

    const { data: practice } = await admin
      .from('practices')
      .select('slug, practice_token, timezone')
      .eq('id', member.practiceId)
      .single()

    if (!practice) {
      return jsonError('Practice not found', 404)
    }

    const tasks = await fetchMemberGateTasks(
      member.practiceId,
      member.userId,
      practice.timezone
    )

    if (!canSignOffEndDay(tasks)) {
      return jsonError('Complete all mandatory tasks first', 403)
    }

    await admin
      .from('practice_members')
      .update({ active_surgery_id: null })
      .eq('id', member.memberId)

    await supabase.auth.signOut()

    return jsonOk({
      ok: true,
      practiceUrl: `/p/${practice.slug}/${practice.practice_token}`,
    })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('End day sign-off failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
