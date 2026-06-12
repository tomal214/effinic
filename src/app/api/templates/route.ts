import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerOrAdmin,
  requireManagerViewerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { createTemplateSchema } from '@/lib/validation/templates'
import { createTemplate, listTemplates } from '@/lib/services/templates'

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireManagerViewerOrAdmin(supabase)
    const admin = createAdminClient()

    const templates = await listTemplates(admin, member.practiceId)
    return jsonOk({ templates })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Templates list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const body = await request.json()
    const parsed = createTemplateSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const template = await createTemplate(
      admin,
      member.practiceId,
      parsed.data
    )

    return jsonOk({ template })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Template create failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
