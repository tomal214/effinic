import { createClient } from '@/lib/supabase/server'
import {
  MemberAuthError,
  requireDashboardMember,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { loadDashboardPageData } from '@/lib/app/page-data'

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireDashboardMember(supabase)
    const { dashboard, timezone } = await loadDashboardPageData(member)

    return jsonOk({ dashboard, timezone })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Dashboard failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
