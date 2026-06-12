import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { resetStaffPin } from '@/lib/services/staff'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const admin = createAdminClient()

    const result = await resetStaffPin(admin, member.practiceId, id)
    if (!result) {
      return jsonError('Staff member not found', 404)
    }

    return jsonOk(result)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Reset PIN failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
