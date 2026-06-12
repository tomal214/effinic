import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { updateSurgerySchema } from '@/lib/validation/surgeries'
import { deleteSurgery, updateSurgery } from '@/lib/services/surgeries'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const body = await request.json()
    const parsed = updateSurgerySchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const surgery = await updateSurgery(
      admin,
      member.practiceId,
      id,
      parsed.data
    )

    if (!surgery) {
      return jsonError('Surgery not found', 404)
    }

    return jsonOk({ surgery })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Surgery update failed:', error)
    return jsonError('Something went wrong', 500)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const admin = createAdminClient()

    const deleted = await deleteSurgery(admin, member.practiceId, id)
    if (!deleted) {
      return jsonError('Surgery not found', 404)
    }

    return jsonOk({ ok: true })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Surgery delete failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
