import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { getTodayTasksForMember } from '@/lib/services/tasks'

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)
    const admin = createAdminClient()

    const { data: practice } = await admin
      .from('practices')
      .select('timezone')
      .eq('id', member.practiceId)
      .single()

    const timezone = practice?.timezone ?? 'Europe/London'
    const result = await getTodayTasksForMember(admin, member, timezone)

    return jsonOk({ ...result, timezone })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Tasks list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
