import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { updateStaffSchema } from '@/lib/validation/staff'
import { softDeleteStaff, updateStaff } from '@/lib/services/staff'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const body = await request.json()
    const parsed = updateStaffSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const updated = await updateStaff(
      admin,
      member.practiceId,
      id,
      parsed.data
    )

    if (!updated) {
      return jsonError('Staff member not found', 404)
    }

    return jsonOk({ member: updated })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Staff update failed:', error)
    return jsonError('Something went wrong', 500)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const admin = createAdminClient()

    const deleted = await softDeleteStaff(admin, member.practiceId, id)
    if (!deleted) {
      return jsonError('Staff member not found', 404)
    }

    return jsonOk({ ok: true })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Staff delete failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
