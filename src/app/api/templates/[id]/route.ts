import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { updateTemplateSchema } from '@/lib/validation/templates'
import { softDeleteTemplate, updateTemplate } from '@/lib/services/templates'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const body = await request.json()
    const parsed = updateTemplateSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const template = await updateTemplate(
      admin,
      member.practiceId,
      id,
      parsed.data
    )

    if (!template) {
      return jsonError('Template not found', 404)
    }

    return jsonOk({ template })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Template update failed:', error)
    return jsonError('Something went wrong', 500)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const admin = createAdminClient()

    const deleted = await softDeleteTemplate(admin, member.practiceId, id)
    if (!deleted) {
      return jsonError('Template not found', 404)
    }

    return jsonOk({ ok: true })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Template delete failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
