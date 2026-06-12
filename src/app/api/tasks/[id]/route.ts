import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireWriteMember,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { amendTaskSchema } from '@/lib/validation/tasks'
import { amendTask } from '@/lib/services/tasks'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireWriteMember(supabase)
    const body = await request.json()
    const parsed = amendTaskSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const { data: practice } = await admin
      .from('practices')
      .select('timezone')
      .eq('id', member.practiceId)
      .single()

    const timezone = practice?.timezone ?? 'Europe/London'
    const result = await amendTask(
      admin,
      member,
      id,
      timezone,
      parsed.data
    )

    if (result.error === 'not_found') {
      return jsonError('Task not found', 404)
    }

    if (result.error === 'forbidden') {
      return jsonError('Forbidden', 403)
    }

    if (result.error === 'locked') {
      return jsonError('Session locked', 403)
    }

    return jsonOk({ ok: true })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Task amend failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
