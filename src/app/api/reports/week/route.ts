import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerViewerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { reportsWeekQuerySchema } from '@/lib/validation/reports'
import { getWeekReportDetail } from '@/lib/services/reports'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireManagerViewerOrAdmin(supabase)

    const { searchParams } = new URL(request.url)
    const parsed = reportsWeekQuerySchema.safeParse({
      weekStart: searchParams.get('weekStart'),
    })

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const detail = await getWeekReportDetail(
      admin,
      member,
      parsed.data.weekStart
    )

    return jsonOk(detail)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Week report detail failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
