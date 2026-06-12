import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireDashboardMember,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import {
  getDashboardData,
  getPracticeTimezone,
} from '@/lib/services/dashboard'

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireDashboardMember(supabase)
    const admin = createAdminClient()
    const timezone = await getPracticeTimezone(admin, member.practiceId)
    const dashboard = await getDashboardData(admin, member, timezone)

    return jsonOk({ dashboard, timezone })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Dashboard failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
