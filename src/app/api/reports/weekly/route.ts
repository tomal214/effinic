import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerViewerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { getPracticeTimezone } from '@/lib/services/dashboard'
import { getWeeklyReports } from '@/lib/services/reports'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireManagerViewerOrAdmin(supabase)
    const admin = createAdminClient()
    const timezone = await getPracticeTimezone(admin, member.practiceId)

    const { searchParams } = new URL(request.url)
    const weeksParam = searchParams.get('weeks')
    const weeks = weeksParam ? Number(weeksParam) : 8
    const safeWeeks = Number.isFinite(weeks) && weeks > 0 && weeks <= 52 ? weeks : 8

    const report = await getWeeklyReports(
      admin,
      member,
      timezone,
      safeWeeks
    )

    return jsonOk({ weeks: report })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Weekly reports failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
