import { createClient } from '@/lib/supabase/server'
import {
  MemberAuthError,
  requireManagerViewerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { loadReportsPageData } from '@/lib/app/page-data'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireManagerViewerOrAdmin(supabase)

    const { searchParams } = new URL(request.url)
    const weeksParam = searchParams.get('weeks')
    const weeks = weeksParam ? Number(weeksParam) : 8
    const safeWeeks = Number.isFinite(weeks) && weeks > 0 && weeks <= 52 ? weeks : 8

    const data = await loadReportsPageData(member, safeWeeks)

    return jsonOk(data)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Weekly reports failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
