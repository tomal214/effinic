import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireWriteMember,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { completeTaskSchema } from '@/lib/validation/tasks'
import { completeTask } from '@/lib/services/tasks'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const member = await requireWriteMember(supabase)
    const body = await request.json()
    const parsed = completeTaskSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const result = await completeTask(admin, member, id, parsed.data)

    if ('error' in result) {
      if (result.error === 'forbidden') {
        return jsonError('Forbidden', 403)
      }
      return jsonError('Task not found', 404)
    }

    return jsonOk({ ok: true })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Task complete failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
