import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireWriteMember,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { uploadSignSchema } from '@/lib/validation/tasks'
import { signTaskPhotoUpload } from '@/lib/services/uploads'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireWriteMember(supabase)
    const body = await request.json()
    const parsed = uploadSignSchema.safeParse(body)

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
    const signed = await signTaskPhotoUpload(
      admin,
      member,
      parsed.data.taskId,
      timezone
    )

    if (!signed) {
      return jsonError('Task not found', 404)
    }

    return jsonOk(signed)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Upload sign failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
