import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { canSignOffMorning } from '@/lib/session/mandatory-gate'
import { fetchMemberGateTasks } from '@/lib/tasks/sign-off-tasks'
import { jsonError, jsonOk } from '@/lib/api/response'

export async function POST() {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)
    const admin = createAdminClient()

    const { data: practice } = await admin
      .from('practices')
      .select('timezone')
      .eq('id', member.practiceId)
      .single()

    const tasks = await fetchMemberGateTasks(
      member.practiceId,
      member.userId,
      practice?.timezone ?? 'Europe/London'
    )

    if (!canSignOffMorning(tasks)) {
      return jsonError('Complete all mandatory morning tasks first', 403)
    }

    await admin
      .from('practice_members')
      .update({ active_surgery_id: null })
      .eq('id', member.memberId)

    return jsonOk({ ok: true })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Morning sign-off failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
